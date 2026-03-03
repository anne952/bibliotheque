import { apiClient } from './apiClient';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const withFallback = async <T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  context: string
): Promise<T> => {
  const warnedContexts = (withFallback as unknown as { __warned?: Set<string> }).__warned
    || ((withFallback as unknown as { __warned: Set<string> }).__warned = new Set<string>());
  const warningKey = 'report-primary-fallback';

  try {
    return await primary();
  } catch (error) {
    if (!warnedContexts.has(warningKey)) {
      console.warn(`${context}: Primary endpoint failed, trying fallback:`, error);
      warnedContexts.add(warningKey);
    }
    return fallback();
  }
};

const formatDateFR = (value: string) => {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
};

const isoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

const pickArray = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
};

const extractItems = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as any[];
  if (Array.isArray(obj.data)) return obj.data as any[];
  if (Array.isArray(obj.results)) return obj.results as any[];
  if (Array.isArray(obj.rows)) return obj.rows as any[];
  return [];
};

const extractCount = (value: unknown): number | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  const candidates = [obj.count, obj.total, obj.totalCount, obj.length];
  for (const c of candidates) {
    const n = Number(c);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
};

const pickCollection = (...values: unknown[]) => {
  for (const value of values) {
    const items = extractItems(value);
    const count = extractCount(value);
    if (items.length > 0 || count !== undefined) {
      return { items, count };
    }
    if (Array.isArray(value)) {
      return { items: value, count: value.length };
    }
  }
  return { items: [], count: undefined as number | undefined };
};

const getAmountFromPurchase = (purchase: any) => {
  const directAmount = Number(purchase?.totalAmount ?? purchase?.amount ?? purchase?.unitPrice);
  if (!Number.isNaN(directAmount) && directAmount > 0) {
    return directAmount;
  }

  const items = toArray(purchase?.items);
  return items.reduce((sum, item) => {
    const quantity = Number(item?.quantity ?? 1) || 1;
    const unitPrice = Number(item?.unitPrice ?? item?.price ?? item?.amount ?? 0) || 0;
    return sum + (quantity * unitPrice);
  }, 0);
};

const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
};

const unwrapDailyReportResponse = (raw: any) => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
      return raw.data;
    }
    if (raw.report && typeof raw.report === 'object' && !Array.isArray(raw.report)) {
      return raw.report;
    }
  }
  return raw;
};

const mapDailyReport = (raw: any, fallbackDate: string) => {
  const payload = unwrapDailyReportResponse(raw);

  const visitorsCollection = pickCollection(
    payload?.visitors,
    payload?.visiteurs,
    payload?.details?.visitors,
    payload?.details?.visiteurs,
    payload?.transactions?.visitors
  );
  const loansCollection = pickCollection(
    payload?.loans,
    payload?.emprunts,
    payload?.details?.loans,
    payload?.details?.emprunts,
    payload?.transactions?.loans
  );
  const salesCollection = pickCollection(
    payload?.sales,
    payload?.ventes,
    payload?.details?.sales,
    payload?.details?.ventes,
    payload?.transactions?.sales
  );
  const purchasesCollection = pickCollection(
    payload?.purchases,
    payload?.achats,
    payload?.details?.purchases,
    payload?.details?.achats,
    payload?.purchaseTransactions,
    payload?.transactions?.purchases
  );
  const donationsCollection = pickCollection(
    payload?.donations,
    payload?.details?.donations,
    payload?.transactions?.donations
  );
  const financialDonationsCollection = pickCollection(
    payload?.financialDonations,
    payload?.donsFinanciers,
    payload?.details?.financialDonations,
    payload?.details?.donsFinanciers
  );
  const materialDonationsCollection = pickCollection(
    payload?.materialDonations,
    payload?.donsMateriels,
    payload?.details?.materialDonations,
    payload?.details?.donsMateriels
  );

  const visitors = visitorsCollection.items;
  const loans = loansCollection.items;
  const sales = salesCollection.items;
  const purchases = purchasesCollection.items;
  const donations = donationsCollection.items;
  const financialDonations = financialDonationsCollection.items;
  const materialDonations = materialDonationsCollection.items;

  const visitorsCount = firstNumber(
    payload?.visitors,
    payload?.visitorsCount,
    payload?.visitorCount,
    payload?.nombreVisiteurs,
    payload?.stats?.visitorsCount,
    payload?.stats?.visitorCount,
    payload?.counts?.visitors,
    payload?.counts?.visitorCount,
    payload?.summary?.visitors,
    payload?.summary?.visitorCount,
    visitorsCollection.count,
    visitors.length
  );
  const loansCount = firstNumber(
    payload?.loans,
    payload?.loansCount,
    payload?.loanCount,
    payload?.stats?.loansCount,
    payload?.stats?.loanCount,
    payload?.counts?.loans,
    payload?.counts?.loanCount,
    payload?.summary?.loans,
    payload?.summary?.loanCount,
    loansCollection.count,
    loans.length
  );
  const salesCount = firstNumber(
    payload?.sales,
    payload?.salesCount,
    payload?.saleCount,
    payload?.stats?.salesCount,
    payload?.stats?.saleCount,
    payload?.counts?.sales,
    payload?.counts?.saleCount,
    payload?.summary?.sales,
    payload?.summary?.saleCount,
    salesCollection.count,
    sales.length
  );
  const financialDonationsCount = firstNumber(
    payload?.donations,
    payload?.financialDonationsCount,
    payload?.donationsFinancialCount,
    payload?.stats?.financialDonationsCount,
    payload?.counts?.financialDonations,
    payload?.summary?.financialDonations,
    financialDonationsCollection.count,
    financialDonations.length
  );

  return {
    id: String(payload?.id || fallbackDate),
    date: formatDateFR(payload?.date || fallbackDate),
    nombreVisiteurs: visitorsCount,
    tableauMateriel: [],
    tableauFinancier: [],
    stats: {
      visitorsCount,
      loansCount,
      salesCount,
      financialDonationsCount
    },
    emprunts: loans.map((item: any, index: number) => ({
      id: String(item.id || `loan-${index}`),
      nom: item.person?.lastName || item.lastName || '',
      prenom: item.person?.firstName || item.firstName || '',
      livres: Array.isArray(item.items) ? item.items.map((it: any) => it.material?.name || it.title || 'Livre') : [],
      dateEmprunt: formatDateFR(item.createdAt || item.date || fallbackDate),
      dateRetour: formatDateFR(item.expectedReturnAt || item.dateRetour || fallbackDate)
    })),
    visiteurs: visitors.map((item: any, index: number) => ({
      id: String(item.id || `visitor-${index}`),
      nom: item.lastName || '',
      prenom: item.firstName || '',
      adresse: item.address || '',
      eglise: item.church || '',
      dateVisite: formatDateFR(item.createdAt || item.date || fallbackDate)
    })),
    ventes: sales.map((item: any, index: number) => ({
      id: String(item.id || `sale-${index}`),
      titres: [item.material?.name || item.title || 'Article'],
      references: [item.material?.reference || item.reference || ''],
      nom: item.person?.lastName || '',
      prenom: item.person?.firstName || '',
      montant: Number(item.totalAmount || item.amount || item.unitPrice || 0),
      date: formatDateFR(item.date || item.createdAt || fallbackDate)
    })),
    donsFinanciers: [...donations, ...financialDonations]
      .filter((item: any) => {
        const kind = String(item.donationKind || item.kind || '').toUpperCase();
        return kind === 'FINANCIAL' || kind === 'MONETARY' || item.amount !== undefined || item.financialTotal !== undefined;
      })
      .map((item: any, index: number) => ({
        id: String(item.id || `donf-${index}`),
        donateur: item.donorName || 'Donateur',
        type: (item.donorType || 'physique').toLowerCase(),
        montant: Number(item.amount || 0),
        mode: (item.paymentMethod || 'espece').toLowerCase(),
        date: formatDateFR(item.date || item.createdAt || fallbackDate),
        description: item.description || ''
      })),
    donsMateriels: [...donations, ...materialDonations]
      .filter((item: any) => {
        const kind = String(item.donationKind || item.kind || '').toUpperCase();
        return kind === 'MATERIAL' || Array.isArray(item.items);
      })
      .map((item: any, index: number) => ({
        id: String(item.id || `donm-${index}`),
        typeMateriel: item.items?.[0]?.type || 'matériel',
        materiel: item.items?.[0]?.name || item.description || 'Matériel',
        quantite: Number(item.items?.[0]?.quantity || 0),
        institution: item.institution || '',
        date: formatDateFR(item.date || item.createdAt || fallbackDate)
      })),
    achats: purchases.map((item: any, index: number) => ({
      id: String(item.id || `purchase-${index}`),
      intitule: item.material?.name || item.items?.[0]?.material?.name || item.description || item.label || 'Achat',
      montant: getAmountFromPurchase(item),
      date: formatDateFR(item.purchaseDate || item.date || item.createdAt || fallbackDate),
      fournisseur: item.supplier?.name || item.supplierName || item.reference || ''
    }))
  };
};

const hasReportData = (report: ReturnType<typeof mapDailyReport>) => {
  const stats = (report as any)?.stats || {};
  const counts = [
    Number(report.nombreVisiteurs || 0),
    Number(report.emprunts?.length || 0),
    Number(report.visiteurs?.length || 0),
    Number(report.ventes?.length || 0),
    Number(report.donsFinanciers?.length || 0),
    Number(report.donsMateriels?.length || 0),
    Number(report.achats?.length || 0),
    Number(stats.visitorsCount || 0),
    Number(stats.loansCount || 0),
    Number(stats.salesCount || 0),
    Number(stats.financialDonationsCount || 0)
  ];

  return counts.some((value) => Number.isFinite(value) && value > 0);
};

const fetchDailyReport = async (queryDate: string) => {
  // Documentation: /reports/daily is primary, /rapport/daily is alias
  return withFallback(
    () =>
      withTimeout(
        apiClient.request('/reports/daily', {
          query: { date: queryDate }
        }),
        8000
      ),
    () =>
      withTimeout(
        apiClient.request('/rapport/daily', {
          query: { date: queryDate }
        }),
        8000
      ),
    `fetchDailyReport(${queryDate})`
  );
};

const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  let index = 0;
  let firstError: unknown = null;

  const worker = async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const item = items[currentIndex];
      try {
        const mapped = await mapper(item);
        results.push(mapped);
      } catch (error) {
        if (!firstError) {
          firstError = error;
        }
      }
    }
  };

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (results.length === 0 && firstError) {
    throw firstError;
  }

  return results;
};

export const reportService = {
  async getRecentReports(days = 7) {
    const dayOffsets = Array.from({ length: days }, (_, i) => i);

    const reports = await runWithConcurrency(dayOffsets, 8, async (offset) => {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const queryDate = isoDate(d);
      const daily = await fetchDailyReport(queryDate);
      const mapped = mapDailyReport(daily, queryDate);
      return hasReportData(mapped) ? mapped : null;
    });

    return reports
      .filter((report): report is NonNullable<typeof report> => report !== null)
      .sort((left, right) => {
        const leftDate = new Date((left as any)?.date || '').getTime();
        const rightDate = new Date((right as any)?.date || '').getTime();
        return rightDate - leftDate;
      });
  },

  async deleteReport(id: string) {
    const reportId = String(id);

    // Try primary endpoint, then alias
    try {
      await apiClient.request(`/reports/${reportId}`, { method: 'DELETE' });
    } catch (error) {
      console.warn(`deleteReport: Primary DELETE /reports/${reportId} failed, trying alias:`, error);
      try {
        await apiClient.request(`/rapport/${reportId}`, { method: 'DELETE' });
      } catch {
        // No DELETE report endpoint in current API contract: treat as UI-only deletion.
        console.info(`deleteReport: No DELETE endpoint available for report ${reportId}`);
      }
    }
  },

  async getDashboardOverview(params: { from: string; to: string; fiscalYearId?: string | number }) {
    const query = {
      from: params.from,
      to: params.to,
      fiscalYearId: params.fiscalYearId
    };

    // Documentation: /reports/dashboard/overview is primary, /rapport/dashboard/overview is alias
    return withFallback(
      () =>
        withTimeout(
          apiClient.request('/reports/dashboard/overview', { query }),
          12000
        ),
      () =>
        withTimeout(
          apiClient.request('/rapport/dashboard/overview', { query }),
          12000
        ),
      'getDashboardOverview'
    );
  }
};
