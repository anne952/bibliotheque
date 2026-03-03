import { apiClient } from '../apiClient';
import { resolveFiscalYearIdFromPeriod } from './fiscalYear';
import { resolveAccountCodeById } from './accountResolver';
import { withFallback, extractArrayFromResponse } from './withFallback';
import { stripSyncIdentifierSuffix } from './labelSanitizer';

export const PLAN_COMPTABLE = [
  { compte: '101', intitule: 'Fonds propres', classe: 'CLASSE 1 - RESSOURCES DURABLES' },
  { compte: '131', intitule: "Subventions d\'equipement", classe: 'CLASSE 1 - RESSOURCES DURABLES' },
  { compte: '211', intitule: 'Terrains et constructions', classe: 'CLASSE 2 - ACTIF IMMOBILISE' },
  { compte: '214', intitule: 'Mobilier et materiel de bureau', classe: 'CLASSE 2 - ACTIF IMMOBILISE' },
  { compte: '215', intitule: 'Materiel informatique', classe: 'CLASSE 2 - ACTIF IMMOBILISE' },
  { compte: '281', intitule: 'Amortissements', classe: 'CLASSE 2 - ACTIF IMMOBILISE' },
  { compte: '311', intitule: 'Livres en stock', classe: 'CLASSE 3 - STOCKS' },
  { compte: '401', intitule: 'Fournisseurs', classe: 'CLASSE 4 - TIERS' },
  { compte: '444', intitule: 'Organismes sociaux', classe: 'CLASSE 4 - TIERS' },
  { compte: '57', intitule: 'Caisse', classe: 'CLASSE 4 - TIERS' },
  { compte: '531', intitule: 'Banque', classe: 'CLASSE 4 - TIERS' },
  { compte: '606', intitule: 'Achats divers (fournitures)', classe: 'CLASSE 6 - CHARGES' },
  { compte: '609', intitule: 'Dons en nature', classe: 'CLASSE 6 - CHARGES' },
  { compte: '611', intitule: 'Achats de livres', classe: 'CLASSE 6 - CHARGES' },
  { compte: '614', intitule: 'Services exterieurs', classe: 'CLASSE 6 - CHARGES' },
  { compte: '641', intitule: 'Salaires', classe: 'CLASSE 6 - CHARGES' },
  { compte: '681', intitule: 'Dotations aux amortissements', classe: 'CLASSE 6 - CHARGES' },
  { compte: '701', intitule: 'Ventes de livres', classe: 'CLASSE 7 - PRODUITS' },
  { compte: '706', intitule: 'Prestations (photocopies, emprunts)', classe: 'CLASSE 7 - PRODUITS' },
  { compte: '711', intitule: 'Cotisations des membres', classe: 'CLASSE 7 - PRODUITS' },
  { compte: '731', intitule: 'Dons et legs financiers', classe: 'CLASSE 7 - PRODUITS' }
];

const mapBalanceRow = (item: any) => ({
  isHeader: false,
  compte: String(
    item.accountCode ||
    item.code ||
    item.compte ||
    item.accountNumber ||
    item.accountId ||
    item.account?.id ||
    ''
  ),
  intitule: stripSyncIdentifierSuffix(item.accountName || item.name || item.intitule || ''),
  totalDebit: Number(item.totalDebit || item.debit || 0),
  totalCredit: Number(item.totalCredit || item.credit || 0),
  soldeDebiteur: Number(item.debitorBalance || item.soldeDebiteur || 0),
  soldeCrediteur: Number(item.creditorBalance || item.soldeCrediteur || 0)
});

const looksLikeOpaqueAccountId = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) return true;
  if (/^[0-9a-f]{24,}$/i.test(trimmed)) return true;
  return false;
};

const normalizeCompteRows = async <T extends { compte: string }>(rows: T[], fiscalYearId?: string) => {
  return Promise.all(
    rows.map(async (row) => {
      const compte = String(row.compte || '');
      if (!looksLikeOpaqueAccountId(compte)) return row;

      try {
        const resolvedCode = await resolveAccountCodeById(compte, fiscalYearId);
        if (resolvedCode) {
          return { ...row, compte: resolvedCode };
        }
      } catch {
        // keep original
      }

      return row;
    })
  );
};

export const balanceService = {
  async getBalance(periode?: string | null) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(periode);

    const data = await withFallback(
      async () =>
        apiClient.request('/accounting/trial-balance', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      async () =>
        apiClient.request('/comptabilite/trial-balance', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      'getBalance'
    );

    const rows = extractArrayFromResponse(data).map(mapBalanceRow);
    return normalizeCompteRows(rows, fiscalYearId);
  },

  async modifierLigne(compte: string, valeurs: unknown) {
    void compte;
    void valeurs;
    throw new Error('La modification directe de la balance n\'est pas supportee par l\'API');
  },

  async rafraichirBalance(periode?: string | null) {
    return this.getBalance(periode);
  },

  async exporterCSV(periode?: string | null) {
    const balance = await this.getBalance(periode);

    let csv = 'N Compte;Intitule;Total Debit;Total Credit;Solde Debiteur;Solde Crediteur\n';

    balance.forEach((item) => {
      csv += `${item.compte};${item.intitule};${item.totalDebit};${item.totalCredit};${item.soldeDebiteur};${item.soldeCrediteur}\n`;
    });

    return csv;
  }
};
