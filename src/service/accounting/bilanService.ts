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

const groupBilanEntries = (entries: any[]) => {
  const sections = {
    immobilisations: new Map<string, { compte: string; libelle: string; montant: number }>(),
    stocks: new Map<string, { compte: string; libelle: string; montant: number }>(),
    tresorerie: new Map<string, { compte: string; libelle: string; montant: number }>(),
    fondsPropres: new Map<string, { compte: string; libelle: string; montant: number }>(),
    dettes: new Map<string, { compte: string; libelle: string; montant: number }>()
  };

  const upsert = (map: Map<string, { compte: string; libelle: string; montant: number }>, compte: string, libelle: string, delta: number) => {
    if (!compte || delta <= 0) return;
    const existing = map.get(compte);
    if (existing) {
      existing.montant += delta;
      return;
    }
    map.set(compte, { compte, libelle, montant: delta });
  };

  entries.forEach((entry) => {
    const lines = Array.isArray(entry?.lines) ? entry.lines : [];
    lines.forEach((line: any) => {
      const compte = accountCodeFromLine(line);
      if (!compte) return;
      const debit = toAmount(line?.debit);
      const credit = toAmount(line?.credit);
      const netDebit = Math.max(0, debit - credit);
      const netCredit = Math.max(0, credit - debit);
      const libelle = stripSyncIdentifierSuffix(line?.accountName || line?.account?.name || line?.description || entry?.description || '');

      if (compte.startsWith('2')) {
        upsert(sections.immobilisations, compte, libelle, netDebit);
        return;
      }

      if (compte.startsWith('3')) {
        upsert(sections.stocks, compte, libelle, netDebit);
        return;
      }

      if (compte.startsWith('57') || compte.startsWith('52') || compte.startsWith('53')) {
        upsert(sections.tresorerie, compte, libelle, netDebit);
        return;
      }

      if (compte.startsWith('1')) {
        upsert(sections.fondsPropres, compte, libelle, netCredit);
        return;
      }

      if (compte.startsWith('4')) {
        upsert(sections.dettes, compte, libelle, netCredit);
      }
    });
  });

  return {
    actif: {
      immobilisations: Array.from(sections.immobilisations.values()).sort((a, b) => a.compte.localeCompare(b.compte)),
      stocks: Array.from(sections.stocks.values()).sort((a, b) => a.compte.localeCompare(b.compte)),
      tresorerie: Array.from(sections.tresorerie.values()).sort((a, b) => a.compte.localeCompare(b.compte))
    },
    passif: {
      fondsPropres: Array.from(sections.fondsPropres.values()).sort((a, b) => a.compte.localeCompare(b.compte)),
      dettes: Array.from(sections.dettes.values()).sort((a, b) => a.compte.localeCompare(b.compte))
    }
  };
};

const buildBilanFromEntriesFallback = async (fiscalYearId?: string) => {
  const data = await withFallback(
    async () =>
      apiClient.request('/accounting/entries', {
        query: fiscalYearId ? { fiscalYearId } : undefined
      }),
    async () =>
      apiClient.request('/comptabilite/entries', {
        query: fiscalYearId ? { fiscalYearId } : undefined
      }),
    'getBilanFallbackEntries'
  );

  const entries = extractArrayFromResponse(data);
  return groupBilanEntries(entries);
};

const mapBilanSection = (items: any[] = []) =>
  items.map((item) => ({
    compte: String(item.accountCode || item.code || item.compte || ''),
    libelle: stripSyncIdentifierSuffix(item.accountName || item.name || item.libelle || ''),
    montant: Number(item.amount || item.montant || 0)
  }));

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

const normalizeBilanData = async (
  data: {
    actif: { immobilisations: Array<{ compte: string }>; stocks: Array<{ compte: string }>; tresorerie: Array<{ compte: string }> };
    passif: { fondsPropres: Array<{ compte: string }>; dettes: Array<{ compte: string }> };
  },
  fiscalYearId?: string
) => {
  return {
    actif: {
      immobilisations: await normalizeCompteRows(data.actif.immobilisations, fiscalYearId),
      stocks: await normalizeCompteRows(data.actif.stocks, fiscalYearId),
      tresorerie: await normalizeCompteRows(data.actif.tresorerie, fiscalYearId)
    },
    passif: {
      fondsPropres: await normalizeCompteRows(data.passif.fondsPropres, fiscalYearId),
      dettes: await normalizeCompteRows(data.passif.dettes, fiscalYearId)
    }
  };
};

export const bilanService = {
  async getBilan(exercice?: string | null) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(exercice);

    const data = await withFallback(
      async () =>
        apiClient.request('/accounting/balance-sheet', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      async () =>
        apiClient.request('/comptabilite/balance-sheet', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      'getBilan'
    );

    if (!data || typeof data !== 'object') {
      throw new Error('Reponse inattendue pour le bilan');
    }

    const payload = data as any;
    const mapped = {
      actif: {
        immobilisations: mapBilanSection(firstNonEmpty(payload.assets?.immobilisations, payload.actif?.immobilisations, payload.assets?.fixedAssets)),
        stocks: mapBilanSection(firstNonEmpty(payload.assets?.stocks, payload.actif?.stocks, payload.assets?.inventory)),
        tresorerie: mapBilanSection(firstNonEmpty(payload.assets?.cash, payload.assets?.tresorerie, payload.actif?.tresorerie, payload.assets?.treasury))
      },
      passif: {
        fondsPropres: mapBilanSection(firstNonEmpty(payload.equity, payload.passives?.fondsPropres, payload.passif?.fondsPropres)),
        dettes: mapBilanSection(firstNonEmpty(payload.liabilities, payload.passives?.dettes, payload.passif?.dettes))
      }
    };

    const hasRows =
      mapped.actif.immobilisations.length > 0 ||
      mapped.actif.stocks.length > 0 ||
      mapped.actif.tresorerie.length > 0 ||
      mapped.passif.fondsPropres.length > 0 ||
      mapped.passif.dettes.length > 0;

    if (hasRows) {
      return normalizeBilanData(mapped, fiscalYearId);
    }

    const fallback = await buildBilanFromEntriesFallback(fiscalYearId);
    return normalizeBilanData(fallback, fiscalYearId);
  },

  async modifierElement(section: string, type: string, index: number, valeurs: any) {
    void section;
    void type;
    void index;
    void valeurs;
    throw new Error('La modification directe du bilan n\'est pas supportee par l\'API');
  },

  async recalculerBilan(exercice?: string | null) {
    return this.getBilan(exercice);
  },

  async exporterPDF(exercice?: string | null) {
    void exercice;
    throw new Error('L\'export PDF du bilan n\'est pas encore implemente');
  }
};
