import { apiClient } from '../apiClient';
import { withFallback, extractArrayFromResponse } from './withFallback';
import { stripSyncIdentifierSuffix } from './labelSanitizer';

const formatDateFR = (value: string) => {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
};

const normalizeDonorType = (value: unknown): 'Physique' | 'Moral' => {
  return String(value || 'Physique').toLowerCase() === 'moral' ? 'Moral' : 'Physique';
};

const parseValidated = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'oui'].includes(normalized)) return true;
    if (['false', '0', 'no', 'non', ''].includes(normalized)) return false;
  }
  return false;
};

const isInvalidDonationJournalTypeError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('journaltype') && message.includes('donation');
};

const mapDonorReportItem = (item: any) => ({
  id: item?.id || item?.personId || item?.donorId || crypto.randomUUID(),
  nom: stripSyncIdentifierSuffix(item?.name || item?.fullName || item?.nom || item?.donorName || 'Donateur'),
  type: normalizeDonorType(item?.type || item?.donorType || 'Physique'),
  montant: Number(item?.financialTotal ?? item?.totalAmount ?? item?.amount ?? item?.montant ?? 0),
  mode: item?.lastPaymentMethod || item?.paymentMethod || item?.mode || 'N/A',
  description: stripSyncIdentifierSuffix(item?.description || `Total dons: ${Number(item?.donationCount || 0)}`),
  contact: item?.email || item?.phone || '',
  date: formatDateFR(item?.lastDonationDate || item?.donationDate || item?.date || new Date().toISOString()),
  valide: parseValidated(item?.isValidated ?? item?.validated)
});

const buildDonationPayload = (donateur: any) => ({
  donorName: donateur.nom,
  donorType: donateur.type,
  donationKind: 'FINANCIAL',
  direction: 'IN',
  amount: Number(donateur.montant) || 0,
  paymentMethod: donateur.mode,
  description: donateur.description || ''
});

export const donateursService = {
  async getDonateurs() {
    // Documentation: /transactions/donations est principal, /rapport/donors est alias rapport
    // Essayer d'abord la route de données principales, puis fallback sur rapport si dispo
    const data = await withFallback(
      async () => {
        const result = await apiClient.request('/transactions/donations');
        // Format: { donations: [...], pagination: {...} }
        if (result && typeof result === 'object' && 'donations' in result) {
          return result.donations;
        }
        // Si c'est directement un array ou enveloppé
        return extractArrayFromResponse(result);
      },
      async () => {
        // Fallback sur l'endpoint de rapport si disponible
        const result = await apiClient.request('/reports/donors');
        return extractArrayFromResponse(result);
      },
      'getDonateurs'
    );

    const fromApi = extractArrayFromResponse(data).map(mapDonorReportItem);

    return fromApi.sort((a, b) =>
      new Date(b.date.split('/').reverse().join('-')).getTime() -
      new Date(a.date.split('/').reverse().join('-')).getTime()
    );
  },

  async ajouterDonateur(donateur: any) {
    // API_ENDPOINTS.md: POST /transactions/donation
    let created;
    try {
      created = await apiClient.request('/transactions/donation', {
        method: 'POST',
        data: buildDonationPayload(donateur)
      });
    } catch (error) {
      if (!isInvalidDonationJournalTypeError(error)) {
        throw error;
      }

      created = await apiClient.request('/transactions/donation', {
        method: 'POST',
        data: {
          ...buildDonationPayload(donateur),
          direction: 'OUT'
        }
      });
    }

    return mapDonorReportItem(created || donateur);
  },

  async modifierDonateur(id: string, donateur: any) {
    // API_ENDPOINTS.md: PUT /transactions/donation/:id
    const updated = await apiClient.request(`/transactions/donation/${id}`, {
      method: 'PUT',
      data: {
        donorName: donateur.nom,
        donorType: donateur.type,
        paymentMethod: donateur.mode,
        donationDate: donateur.date,
        description: donateur.description,
        amount: Number(donateur.montant) || 0
      }
    });

    return mapDonorReportItem(updated || { ...donateur, id });
  },

  async supprimerDonateur(id: string) {
    // API_ENDPOINTS.md: DELETE /transactions/donation/:id
    await apiClient.request(`/transactions/donation/${id}`, {
      method: 'DELETE'
    });
  },

  async validerDonateur(id: string) {
    const updated = await apiClient.request(`/transactions/donation/${id}`, {
      method: 'PUT',
      data: { isValidated: true }
    });

    return mapDonorReportItem(updated || { id });
  },

  async rechercherDonateurs(searchTerm: string) {
    const donateurs = await this.getDonateurs();
    const term = searchTerm.toLowerCase();
    return donateurs.filter((d) =>
      d.nom.toLowerCase().includes(term) ||
      d.description.toLowerCase().includes(term) ||
      (d.contact || '').toLowerCase().includes(term)
    );
  },

  async getStats() {
    const donateurs = await this.getDonateurs();
    const total = donateurs.reduce((s, d) => s + d.montant, 0);

    return {
      total,
      nombre: donateurs.length,
      moyenne: total / (donateurs.length || 1),
      parMode: donateurs.reduce((acc: Record<string, number>, d) => {
        acc[d.mode] = (acc[d.mode] || 0) + d.montant;
        return acc;
      }, {}),
      parType: donateurs.reduce((acc: Record<string, number>, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
};
