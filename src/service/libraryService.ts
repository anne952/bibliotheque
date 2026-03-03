import { reportService } from './reportService';
import { apiClient } from './apiClient';

const requestRender = <T = unknown>(
  path: string,
  options: Parameters<typeof apiClient.request<T>>[1] = {}
) => {
  return apiClient.request<T>(path, { ...options, target: 'render' });
};

const isFiscalYearError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('exercice comptable') ||
    message.includes('fiscal year') ||
    message.includes('fiscalyear')
  );
};

const isInvalidDonationJournalTypeError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('journaltype') && message.includes('donation');
};

const ensureAccountingSetupOnRender = async () => {
  try {
    await requestRender('/init/setup', { method: 'POST', auth: false });
  } catch {
    // best effort
  }
};

const createTransactionWithRetry = async <T = any>(path: string, data: Record<string, unknown>) => {
  try {
    return await requestRender<T>(path, {
      method: 'POST',
      data
    });
  } catch (error) {
    if (!isFiscalYearError(error)) {
      throw error;
    }

    await ensureAccountingSetupOnRender();

    return requestRender<T>(path, {
      method: 'POST',
      data
    });
  }
};

const isoDate = (value?: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [d, m, y] = value.split('/');
    return `${y}-${m}-${d}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const withMeta = <T extends object>(item: T, backendId: string, source: string) => ({
  ...item,
  __meta: { backendId, source }
});

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const getBackendId = (item: any) => String(item?.__meta?.backendId || item?.id || '');

const findMaterialByReference = async (reference?: string, title?: string) => {
  const materials = await requestRender<any[]>('/materials');
  const normalizedRef = (reference || '').toLowerCase();
  const normalizedTitle = (title || '').toLowerCase();

  return (materials || []).find((item) => {
    const itemRef = String(item.reference || '').toLowerCase();
    const itemName = String(item.name || '').toLowerCase();
    return (normalizedRef && itemRef === normalizedRef) || (normalizedTitle && itemName.includes(normalizedTitle));
  });
};

const fetchPersons = async (query: Record<string, string>) => {
  try {
    return await withTimeout(requestRender<any[]>('/persons', { query }), 12000, []);
  } catch {
    return [];
  }
};

const fetchAllPersons = async () => {
  try {
    return await withTimeout(requestRender<any[]>('/persons'), 12000, []);
  } catch {
    return [];
  }
};

const fetchAllDonations = async () => {
  // Documentation API_ENDPOINTS.md: GET /transactions/donations
  try {
    const data = await withTimeout(requestRender<any>('/transactions/donations'), 12000, null);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.donations)) return data.donations;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
  } catch (error) {
    console.warn('Failed to fetch donations from /transactions/donations:', error);
  }

  return [];
};

const fetchAllMaterials = async () => {
  // Documentation API_ENDPOINTS.md: Principal /materials, Alias /materiel, /bibliotheque
  const candidates = ['/materials', '/materiel', '/bibliotheque'];
  
  for (const path of candidates) {
    try {
      const data = await withTimeout(requestRender<any>(path), 12000, null);
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.data)) return data.data;
    } catch {
      // Continuer vers le suivant
    }
  }
  
  return [];
};

const safePersonRecords = async (persons: any[], endpoint: 'loans' | 'sales' | 'purchases') => {
  const records = await Promise.all(
    persons.map(async (person) => {
      try {
        const data = await withTimeout(requestRender<any[]>(`/persons/${person.id}/${endpoint}`), 8000, []);
        return { person, data: Array.isArray(data) ? data : [] };
      } catch {
        return { person, data: [] };
      }
    })
  );

  return records;
};

export const libraryService = {
  async importPaste(tab: string, pastedData: string) {
    return requestRender<any>('/bibliotheque/import-paste', {
      method: 'POST',
      data: {
        pastedData,
        tab
      }
    });
  },

  async getBookCatalog() {
    const materials = await fetchAllMaterials();

    return materials
      .filter((item: any) => {
        const type = String(item?.type || '').toUpperCase();
        const typeFr = String(item?.type || '').toLowerCase();
        return type === 'BOOK' || typeFr.includes('livre') || typeFr.includes('book');
      })
      .map((item: any) => ({
        id: String(item?.id || ''),
        titre: String(item?.name || item?.title || item?.nom || '').trim(),
        reference: String(item?.reference || '').trim()
      }))
      .filter((item: any) => item.titre.length > 0);
  },

  async loadLibraryData() {
    const [borrowers, visitorsRaw, buyers, suppliers, allPersons] = await Promise.all([
      fetchPersons({ isBorrower: 'true' }),
      fetchPersons({ isVisitor: 'true' }),
      fetchPersons({ isBuyer: 'true' }),
      fetchPersons({ isSupplier: 'true' }),
      fetchAllPersons()
    ]);

    const [loanGroups, salesGroups, purchaseGroups, purchaseGroupsAllPersons, donationRows, reports] = await Promise.all([
      safePersonRecords(borrowers, 'loans'),
      safePersonRecords(buyers, 'sales'),
      safePersonRecords(suppliers, 'purchases'),
      safePersonRecords(allPersons, 'purchases'),
      fetchAllDonations(),
      withTimeout(reportService.getRecentReports(30), 10000, [])
    ]);

    const mergedPurchaseGroupsMap = new Map<string, { person: any; data: any[] }>();
    [...purchaseGroups, ...purchaseGroupsAllPersons].forEach((group) => {
      const personId = String(group?.person?.id || '');
      if (!personId) return;

      const previous = mergedPurchaseGroupsMap.get(personId);
      if (!previous) {
        mergedPurchaseGroupsMap.set(personId, { person: group.person, data: Array.isArray(group.data) ? group.data : [] });
        return;
      }

      const mergedData = [...previous.data, ...(Array.isArray(group.data) ? group.data : [])];
      const deduped = Array.from(new Map(mergedData.map((entry: any) => [String(entry?.id || crypto.randomUUID()), entry])).values());
      mergedPurchaseGroupsMap.set(personId, { person: previous.person || group.person, data: deduped });
    });
    const effectivePurchaseGroups = Array.from(mergedPurchaseGroupsMap.values());

    const emprunts = loanGroups.flatMap(({ person, data }) =>
      data.map((loan: any) => {
        const livres = Array.isArray(loan.items)
          ? loan.items.map((it: any) => ({
              titre: it.material?.name || it.material?.title || it.title || '',
              reference: it.material?.reference || it.reference || '',
              quantite: Number(it.quantity || 1)
            }))
          : [];

        const item = {
          id: String(loan.id),
          nom: person.lastName || person.nom || '',
          prenom: person.firstName || person.prenom || '',
          dateEmprunt: isoDate(loan.createdAt || loan.loanDate || loan.date),
          telephone: person.phone || '',
          email: person.email || '',
          livres,
          dureeEmprunt: 14,
          egliseProvenance: person.church || '',
          dateRetour: isoDate(loan.expectedReturnAt || loan.returnDate),
          renouvele: Boolean(loan.renewed)
        };

        return withMeta(item, String(loan.id), 'loan');
      })
    );

    const mergedVisitorsSource = Array.from(
      new Map(
        [...visitorsRaw, ...allPersons].map((person: any) => [String(person.id), person])
      ).values()
    );

    const visiteurs = mergedVisitorsSource.map((person: any) =>
      withMeta({
        id: String(person.id),
        nom: person.lastName || '',
        prenom: person.firstName || '',
        adresse: person.address || '',
        egliseProvenance: person.church || '',
        telephone: person.phone || '',
        email: person.email || '',
        dateVisite: isoDate(person.createdAt || person.updatedAt)
      }, String(person.id), 'persons')
    );

    const ventes = salesGroups.flatMap(({ person, data }) =>
      data.map((sale: any) => {
        const items = Array.isArray(sale.items) ? sale.items : [];
        const titres = items.map((it: any) => it.material?.name || it.title || '');
        const references = items.map((it: any) => it.material?.reference || it.reference || '');

        const mapped = {
          id: String(sale.id),
          titres,
          references,
          nom: person.lastName || '',
          prenom: person.firstName || '',
          adresse: person.address || '',
          montant: Number(sale.totalAmount || sale.amount || 0),
          dateVente: isoDate(sale.saleDate || sale.createdAt || sale.date)
        };

        return withMeta(mapped, String(sale.id), 'sale');
      })
    );

    const achatsFromPersons = effectivePurchaseGroups.flatMap(({ person, data }) =>
      data.map((purchase: any) => {
        const item0 = Array.isArray(purchase.items) ? purchase.items[0] : null;
        const mapped = {
          id: String(purchase.id),
          intitule: item0?.material?.name || purchase.notes || purchase.description || 'Achat',
          montant: Number(purchase.totalAmount || purchase.amount || purchase.unitPrice || 0),
          dateAchat: isoDate(purchase.purchaseDate || purchase.createdAt || purchase.date),
          fournisseur: `${person.lastName || ''} ${person.firstName || ''}`.trim() || String(purchase.reference || '')
        };
        return withMeta(mapped, String(purchase.id), 'purchase');
      })
    );

    const achatsFromReports = reports.flatMap((report: any) =>
      (report.achats || []).map((item: any) =>
        withMeta({
          id: String(item.id || ''),
          intitule: String(item.intitule || item.description || item.label || 'Achat'),
          montant: Number(item.montant || item.amount || 0),
          dateAchat: isoDate(item.dateAchat || item.date || report.date),
          fournisseur: String(item.fournisseur || item.reference || '')
        }, String(item.id || ''), 'purchase')
      )
    );

    const achats = achatsFromPersons.length > 0
      ? [...achatsFromPersons, ...achatsFromReports]
      : achatsFromReports;

    const mappedDonationsFromApi = (donationRows || []).map((item: any, index: number) => {
      const donationKind = String(item?.donationKind || item?.kind || '').toUpperCase();
      const direction = String(item?.direction || '').toUpperCase();
      const hasItems = Array.isArray(item?.items) && item.items.length > 0;
      const rawAmount = Number(item?.amount || 0);
      const isFinancialByKind = donationKind.includes('FIN') || donationKind.includes('MON') || donationKind.includes('CASH');
      const isMaterialByKind = donationKind.includes('MAT');
      const inferredKind = isFinancialByKind
        ? 'FINANCIAL'
        : isMaterialByKind
          ? 'MATERIAL'
          : hasItems
            ? 'MATERIAL'
            : rawAmount > 0
              ? 'FINANCIAL'
              : '';
      const dateRaw = item?.donationDate || item?.date || item?.createdAt;
      const mapped = {
        id: String(item?.id || `don-${index}`),
        donationKind: inferredKind,
        direction,
        donorName: item?.donorName || item?.donor?.fullName || item?.donor?.name || 'Donateur',
        donorType: String(item?.donorType || item?.type || 'physique').toLowerCase(),
        amount: rawAmount,
        paymentMethod: String(item?.paymentMethod || item?.mode || 'espece').toLowerCase(),
        description: item?.description || '',
        institution: item?.institution || '',
        date: isoDate(dateRaw),
        items: Array.isArray(item?.items) ? item.items : []
      };
      return mapped;
    });

    const donsFinanciersFromApi = mappedDonationsFromApi
      .filter((item) => item.donationKind === 'FINANCIAL')
      .map((item) =>
        withMeta({
          id: item.id,
          donateur: item.donorName,
          type: (item.donorType || 'physique') as 'physique' | 'moral',
          montant: Number(item.amount || 0),
          mode: (item.paymentMethod || 'espece') as 'espece' | 'cheque' | 'virement' | 'nature',
          dateDon: item.date,
          description: item.description || ''
        }, item.id, 'donation')
      );

    const donsMaterielFromApi = mappedDonationsFromApi
      .filter((item) => item.donationKind === 'MATERIAL')
      .map((item) =>
        withMeta({
          id: item.id,
          typeMateriel: item.items?.[0]?.type || 'autre',
          materiel: item.items?.[0]?.name || item.description || '',
          quantite: Number(item.items?.[0]?.quantity || 0),
          institutionDestinaire: item.institution || '',
          dateDon: item.date,
          description: item.description || ''
        }, item.id, 'donation')
      );

    const donsFinanciersFromReports = reports.flatMap((report) =>
      (report.donsFinanciers || []).map((item: any) => withMeta({
        id: item.id,
        donateur: item.donateur,
        type: item.type,
        montant: Number(item.montant || 0),
        mode: item.mode,
        dateDon: isoDate(item.dateDon || item.date || report.date),
        description: item.description || ''
      }, String(item.id || ''), 'donation'))
    );

    const donsMaterielFromReports = reports.flatMap((report) =>
      (report.donsMateriels || []).map((item: any) => withMeta({
        id: item.id,
        typeMateriel: item.typeMateriel || '',
        materiel: item.materiel || '',
        quantite: Number(item.quantite || 0),
        institutionDestinaire: item.institutionDestinaire || item.institution || '',
        dateDon: isoDate(item.dateDon || item.date || report.date),
        description: item.description || ''
      }, String(item.id || ''), 'donation'))
    );

    const donsFinanciers = donsFinanciersFromApi.length > 0
      ? [...donsFinanciersFromApi, ...donsFinanciersFromReports]
      : donsFinanciersFromReports;
    const donsMateriel = donsMaterielFromApi.length > 0
      ? [...donsMaterielFromApi, ...donsMaterielFromReports]
      : donsMaterielFromReports;

    const dedupeById = <T extends { id: string }>(arr: T[]) => Array.from(new Map(arr.map((x) => [x.id, x])).values());

    return {
      emprunts: dedupeById(emprunts),
      visiteurs: dedupeById(visiteurs),
      ventes: dedupeById(ventes),
      donsFinanciers: dedupeById(donsFinanciers),
      donsMateriel: dedupeById(donsMateriel),
      achats: dedupeById(achats)
    };
  },

  async saveVisiteur(item: any) {
    const payload = {
      firstName: item.prenom,
      lastName: item.nom,
      phone: item.telephone || null,
      email: item.email || null,
      address: item.adresse || null,
      church: item.egliseProvenance || null,
      isVisitor: true
    };

    if (item.__meta?.source === 'persons' && item.__meta?.backendId) {
      await requestRender(`/persons/${item.__meta.backendId}`, {
        method: 'PUT',
        data: payload
      });
      return item;
    }

    const created = await requestRender<any>('/persons', {
      method: 'POST',
      data: payload
    });

    return withMeta({ ...item, id: String(created.id) }, String(created.id), 'persons');
  },

  async saveDonFinancier(item: any) {
    const payload = {
      donorName: item.donateur,
      donorType: item.type,
      donationKind: 'FINANCIAL',
      direction: 'IN',
      amount: Number(item.montant || 0),
      paymentMethod: item.mode,
      donationDate: isoDate(item.dateDon),
      description: item.description || ''
    };

    let created;
    try {
      created = await createTransactionWithRetry<any>('/transactions/donation', payload);
    } catch (error) {
      if (!isInvalidDonationJournalTypeError(error)) {
        throw error;
      }

      created = await createTransactionWithRetry<any>('/transactions/donation', {
        ...payload,
        direction: 'OUT'
      });
    }

    return withMeta({ ...item, id: String(created.id) }, String(created.id), 'donation');
  },

  async saveDonMateriel(item: any) {
    const material = await findMaterialByReference(undefined, item.materiel);
    if (!material?.id) {
      throw new Error('Materiel introuvable pour le don materiel');
    }

    const created = await createTransactionWithRetry<any>('/transactions/donation', {
      donorName: item.institutionDestinaire || 'Institution',
      donorType: 'moral',
      donationKind: 'MATERIAL',
      donationDate: isoDate(item.dateDon),
      description: item.description || item.materiel,
      institution: item.institutionDestinaire || null,
      items: [{ materialId: material.id, quantity: Number(item.quantite || 1) }]
    });

    return withMeta({ ...item, id: String(created.id) }, String(created.id), 'donation');
  },

  async saveVente(item: any) {
    const person = await requestRender<any>('/persons', {
      method: 'POST',
      data: {
        firstName: item.prenom,
        lastName: item.nom,
        address: item.adresse || null,
        isBuyer: true
      }
    });

    const createdSales: any[] = [];
    const missingTitles: string[] = [];
    for (let i = 0; i < (item.titres || []).length; i += 1) {
      const title = item.titres[i];
      const reference = item.references?.[i];
      const material = await findMaterialByReference(reference, title);
      if (!material?.id) {
        missingTitles.push(String(title || '').trim());
        continue;
      }

      const sale = await createTransactionWithRetry<any>('/transactions/sale', {
        materialId: material.id,
        quantity: 1,
        unitPrice: Number(item.montant || 0),
        personId: person.id,
        paymentMethod: 'cash',
        saleDate: isoDate(item.dateVente)
      });
      createdSales.push(sale);
    }

    if (missingTitles.length > 0) {
      throw new Error(`Livre(s) introuvable(s) pour la vente: ${missingTitles.join(', ')}`);
    }

    if (createdSales.length === 0) {
      throw new Error('Aucun materiel API trouve pour cette vente');
    }

    const firstSale = createdSales[0];
    return withMeta({ ...item, id: String(firstSale.id) }, String(firstSale.id), 'sale');
  },

  async saveAchat(item: any) {
    const material = await findMaterialByReference(undefined, item.intitule);
    const supplierName = String(item.fournisseur || '').trim();
    let supplierId: string | undefined;

    if (supplierName) {
      try {
        const suppliers = await fetchPersons({ isSupplier: 'true' });
        const normalizedSupplierName = supplierName.toLowerCase();

        const matchedSupplier = suppliers.find((person: any) => {
          const fullName = `${String(person?.firstName || '').trim()} ${String(person?.lastName || '').trim()}`.trim().toLowerCase();
          const lastName = String(person?.lastName || '').trim().toLowerCase();
          const company = String(person?.companyName || '').trim().toLowerCase();
          return fullName === normalizedSupplierName || lastName === normalizedSupplierName || company === normalizedSupplierName;
        });

        if (matchedSupplier?.id) {
          supplierId = String(matchedSupplier.id);
        } else {
          const createdSupplier = await requestRender<any>('/persons', {
            method: 'POST',
            data: {
              firstName: supplierName,
              lastName: 'Fournisseur',
              isSupplier: true
            }
          });
          supplierId = createdSupplier?.id ? String(createdSupplier.id) : undefined;
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Impossible de lier le fournisseur de l\'achat');
      }
    }

    const payload: Record<string, unknown> = {
      quantity: 1,
      unitPrice: Number(item.montant || 0),
      purchaseDate: isoDate(item.dateAchat),
      reference: item.fournisseur || null,
      notes: item.intitule || null
    };

    if (material?.id) {
      payload.materialId = material.id;
    }

    if (supplierId) {
      payload.supplierId = supplierId;
    }

    const created = await createTransactionWithRetry<any>('/transactions/purchase', payload);

    return withMeta({ ...item, id: String(created.id) }, String(created.id), 'purchase');
  },

  async saveEmprunt(item: any) {
    const person = await requestRender<any>('/persons', {
      method: 'POST',
      data: {
        firstName: item.prenom,
        lastName: item.nom,
        phone: item.telephone || null,
        email: item.email || null,
        church: item.egliseProvenance || null,
        isBorrower: true
      }
    });

    const items = [] as Array<{ materialId: string; quantity: number }>;
    const missingTitles: string[] = [];
    for (const livre of item.livres || []) {
      const material = await findMaterialByReference(livre.reference, livre.titre);
      if (material?.id) {
        items.push({ materialId: String(material.id), quantity: Number(livre.quantite || 1) });
      } else {
        missingTitles.push(String(livre?.titre || '').trim());
      }
    }

    if (missingTitles.length > 0) {
      throw new Error(`Livre(s) introuvable(s) pour l'emprunt: ${missingTitles.join(', ')}`);
    }

    if (items.length === 0) {
      throw new Error('Aucun livre API trouve pour cet emprunt');
    }

    const created = await requestRender<any>('/transactions/loan', {
      method: 'POST',
      data: {
        personId: person.id,
        expectedReturnAt: isoDate(item.dateRetour),
        notes: item.renouvele ? 'Renouvele' : '',
        items
      }
    });

    return withMeta({ ...item, id: String(created.id) }, String(created.id), 'loan');
  },

  async updateRecord(tab: string, item: any) {
    const backendId = getBackendId(item);
    if (!backendId) throw new Error('ID backend manquant pour la modification');

    if (tab === 'visite') {
      return this.saveVisiteur(item);
    }

    if (tab === 'emprunt') {
      await requestRender(`/transactions/loan/${backendId}`, {
        method: 'PUT',
        data: {
          expectedReturnAt: isoDate(item.dateRetour),
          notes: item.renouvele ? 'Renouvele' : ''
        }
      });
      return withMeta(item, backendId, 'loan');
    }

    if (tab === 'vente') {
      await requestRender(`/transactions/sale/${backendId}`, {
        method: 'PUT',
        data: {
          saleDate: isoDate(item.dateVente),
          unitPrice: Number(item.montant || 0)
        }
      });
      return withMeta(item, backendId, 'sale');
    }

    if (tab === 'achat') {
      await requestRender(`/transactions/purchase/${backendId}`, {
        method: 'PUT',
        data: {
          purchaseDate: isoDate(item.dateAchat),
          unitPrice: Number(item.montant || 0),
          notes: item.fournisseur || null
        }
      });
      return withMeta(item, backendId, 'purchase');
    }

    if (tab === 'dons-financier') {
      await requestRender(`/transactions/donation/${backendId}`, {
        method: 'PUT',
        data: {
          donorName: item.donateur,
          donorType: item.type,
          amount: Number(item.montant || 0),
          paymentMethod: item.mode,
          donationDate: isoDate(item.dateDon),
          description: item.description || ''
        }
      });
      return withMeta(item, backendId, 'donation');
    }

    if (tab === 'dons-materiel') {
      await requestRender(`/transactions/donation/${backendId}`, {
        method: 'PUT',
        data: {
          donorName: item.institutionDestinaire || 'Institution',
          donorType: 'moral',
          donationDate: isoDate(item.dateDon),
          description: item.description || item.materiel || '',
          institution: item.institutionDestinaire || null
        }
      });
      return withMeta(item, backendId, 'donation');
    }

    throw new Error('Modification API non disponible pour cet element');
  },

  async deleteRecord(tab: string, item: any) {
    const backendId = getBackendId(item);
    if (!backendId) throw new Error('ID backend manquant pour la suppression');

    if (tab === 'visite') {
      await requestRender(`/persons/${backendId}`, { method: 'DELETE' });
      return;
    }

    if (tab === 'emprunt') {
      await requestRender(`/transactions/loan/${backendId}`, { method: 'DELETE' });
      return;
    }

    if (tab === 'vente') {
      await requestRender(`/transactions/sale/${backendId}`, { method: 'DELETE' });
      return;
    }

    if (tab === 'achat') {
      await requestRender(`/transactions/purchase/${backendId}`, { method: 'DELETE' });
      return;
    }

    if (tab === 'dons-financier' || tab === 'dons-materiel') {
      await requestRender(`/transactions/donation/${backendId}`, { method: 'DELETE' });
      return;
    }

    throw new Error('Suppression API non disponible pour cet element');
  }
};
