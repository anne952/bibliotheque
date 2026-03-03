import { apiClient } from '../apiClient';
import { resolveFiscalYearIdFromPeriod } from './fiscalYear';
import { resolveAccountCodeById } from './accountResolver';
import { withFallback, extractArrayFromResponse } from './withFallback';
import { stripSyncIdentifierSuffix } from './labelSanitizer';

const toItems = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.rows)) return value.rows;
  return [];
};

const firstNonEmpty = (...values: any[]) => {
  for (const value of values) {
    const items = toItems(value);
    if (items.length > 0) return items;
  }
  return [] as any[];
};

const accountCodeFromLine = (line: any) =>
  String(line?.accountCode || line?.account?.code || line?.account || line?.accountId || '').trim();

const toAmount = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const sumByAccount = (entries: any[], classPrefix: string, mode: 'produit' | 'charge') => {
  const grouped = new Map<string, { compte: string; libelle: string; montant: number; type: 'produit' | 'charge'; classe: string }>();

  entries.forEach((entry) => {
    const lines = Array.isArray(entry?.lines) ? entry.lines : [];
    lines.forEach((line: any) => {
      const compte = accountCodeFromLine(line);
      if (!compte || !compte.startsWith(classPrefix)) return;

      const debit = toAmount(line?.debit);
      const credit = toAmount(line?.credit);
      const lineAmount = mode === 'produit' ? Math.max(0, credit - debit) : Math.max(0, debit - credit);
      if (lineAmount <= 0) return;

      const existing = grouped.get(compte);
      if (existing) {
        existing.montant += lineAmount;
        return;
      }

      grouped.set(compte, {
        compte,
        libelle: stripSyncIdentifierSuffix(line?.accountName || line?.account?.name || line?.description || entry?.description || ''),
        montant: lineAmount,
        type: mode,
        classe: compte.substring(0, 2)
      });
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.compte.localeCompare(b.compte));
};

const buildFromEntriesFallback = async (fiscalYearId?: string) => {
  const data = await withFallback(
    async () =>
      apiClient.request('/accounting/entries', {
        query: fiscalYearId ? { fiscalYearId } : undefined
      }),
    async () =>
      apiClient.request('/comptabilite/entries', {
        query: fiscalYearId ? { fiscalYearId } : undefined
      }),
    'getCompteResultatFallbackEntries'
  );

  const entries = extractArrayFromResponse(data);
  return {
    produits: sumByAccount(entries, '7', 'produit'),
    charges: sumByAccount(entries, '6', 'charge')
  };
};

const mapResultItems = (items: any[] = [], type = 'produit') =>
  items.map((item) => {
    const compte = String(item.accountCode || item.code || item.compte || '');
    return {
      compte,
      libelle: stripSyncIdentifierSuffix(item.accountName || item.name || item.libelle || ''),
      montant: Number(item.amount || item.montant || 0),
      type,
      classe: compte.substring(0, 2)
    };
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
        // keep original value
      }

      return row;
    })
  );
};

export const compteResultatService = {
  async getCompteResultat(exercice?: string | null) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(exercice);

    const data = await withFallback(
      async () =>
        apiClient.request('/accounting/income-statement', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      async () =>
        apiClient.request('/comptabilite/income-statement', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      'getCompteResultat'
    );

    if (!data || typeof data !== 'object') {
      throw new Error('Reponse inattendue pour le compte de resultat');
    }

    const payload = data as any;
    const produitsRaw = mapResultItems(firstNonEmpty(payload.revenues, payload.produits, payload.income, payload.products), 'produit');
    const chargesRaw = mapResultItems(firstNonEmpty(payload.expenses, payload.charges, payload.costs), 'charge');
    const produits = await normalizeCompteRows(produitsRaw, fiscalYearId);
    const charges = await normalizeCompteRows(chargesRaw, fiscalYearId);

    if (produits.length > 0 || charges.length > 0) {
      return { produits, charges };
    }

    const fallback = await buildFromEntriesFallback(fiscalYearId);
    return {
      produits: await normalizeCompteRows(fallback.produits, fiscalYearId),
      charges: await normalizeCompteRows(fallback.charges, fiscalYearId)
    };
  },

  async modifierLigne(type: string, index: number, valeurs: unknown) {
    void type;
    void index;
    void valeurs;
    throw new Error('La modification directe du compte de resultat n\'est pas supportee par l\'API');
  },

  async ajouterLigne(type: string, ligne: unknown) {
    void type;
    void ligne;
    throw new Error('L\'ajout direct au compte de resultat n\'est pas supporte par l\'API');
  },

  async supprimerLigne(type: string, index: number) {
    void type;
    void index;
    throw new Error('La suppression directe du compte de resultat n\'est pas supportee par l\'API');
  },

  async calculerResultatNet(exercice?: string | null) {
    const compteResultat = await this.getCompteResultat(exercice);
    const totalProduits = compteResultat.produits.reduce((s: number, p: any) => s + p.montant, 0);
    const totalCharges = compteResultat.charges.reduce((s: number, c: any) => s + c.montant, 0);
    return totalProduits - totalCharges;
  }
};
