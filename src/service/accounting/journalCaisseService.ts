import { apiClient } from '../apiClient';
import { resolveFiscalYearIdFromPeriod } from './fiscalYear';
import { resolveAccountIdByNumber } from './accountResolver';
import { withFallback, extractArrayFromResponse } from './withFallback';
import { stripSyncIdentifierSuffix } from './labelSanitizer';
import type { AccountingEntryDTO } from '../../types/accounting';

const formatDateFR = (value: string) => {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
};

const formatDateISO = (value: string) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
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

const fromApiPayload = (entry: any) => {
  const dto = (entry || {}) as AccountingEntryDTO;
  const businessLabel = dto.businessLabel ?? dto.description ?? '';
  const syncIdentifier = dto.sync?.identifier ?? dto.sourceId ?? null;
  const syncSourceType = dto.sync?.sourceType ?? dto.sourceType ?? null;

  return {
    businessLabel: stripSyncIdentifierSuffix(businessLabel),
    syncIdentifier: syncIdentifier ? String(syncIdentifier) : null,
    syncSourceType: syncSourceType ? String(syncSourceType) : null
  };
};

const resolveSyncMeta = (entry: any) => {
  const syncIdentifier = String(
    entry?.sync?.identifier ??
    entry?.syncIdentifier ??
    entry?.sourceId ??
    entry?.__meta?.backendId ??
    ''
  ).trim();

  const syncSourceType = String(
    entry?.sync?.sourceType ??
    entry?.syncSourceType ??
    entry?.sourceType ??
    entry?.__meta?.source ??
    ''
  ).trim();

  return {
    identifier: syncIdentifier || null,
    sourceType: syncSourceType || null
  };
};

const resolveFirstAvailableAccount = async (candidates: string[], fiscalYearId?: string) => {
  for (const accountNumber of candidates) {
    try {
      const resolved = await resolveAccountIdByNumber(accountNumber, fiscalYearId);
      if (resolved) {
        return resolved;
      }
    } catch {
      // try next candidate
    }
  }

  const safeFallback = candidates.find((account) => account !== '521') || candidates[0] || '57';
  return safeFallback;
};

const resolveTreasuryAccount = async (mode?: string, fiscalYearId?: string) => {
  const normalized = String(mode || '').trim().toLowerCase();
  if (['virement', 'carte', 'carte bancaire', 'cheque', 'chèque'].includes(normalized)) {
    return resolveFirstAvailableAccount(['521', '531', '57'], fiscalYearId);
  }
  return resolveFirstAvailableAccount(['57', '521', '531'], fiscalYearId);
};

const resolveMainAccount = (operation: any, isEntree: boolean, counterAccount: string) => {
  const explicitMain = String(
    operation.compte ||
    operation.compteContrepartie ||
    operation.mainAccount ||
    ''
  ).trim();

  if (explicitMain && explicitMain !== counterAccount) {
    return explicitMain;
  }

  const fallbackMain: string = isEntree ? '701' : '601';
  if (fallbackMain !== counterAccount) {
    return fallbackMain;
  }

  return counterAccount === '57' ? '521' : '57';
};

const mapCashEntry = (entry: any) => {
  const lines = Array.isArray(entry?.lines) ? entry.lines : [];
  const treasuryLine = lines.find((line: any) => {
    const account = String(line?.accountCode || line?.account?.code || line?.account || line?.accountId || '').trim();
    return account.startsWith('57') || account.startsWith('521') || account.startsWith('531');
  });
  const mainLine = treasuryLine || lines.find((line: any) => Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0) || lines[0] || {};
  const debit = Number(mainLine?.debit || 0);
  const credit = Number(mainLine?.credit || 0);
  const amount = Math.max(debit, credit);
  const isEntree = debit >= credit;
  const mapped = fromApiPayload({
    businessLabel: entry?.businessLabel,
    description: entry?.description || '',
    sync: entry?.sync,
    sourceType: entry?.sourceType,
    sourceId: entry?.sourceId
  });

  return {
    id: entry?.id,
    date: formatDateFR(entry?.date),
    description: mapped.businessLabel,
    reference: entry?.pieceNumber || '',
    entree: isEntree ? amount : 0,
    sortie: isEntree ? 0 : amount,
    mode: 'Espece',
    valide: parseValidated(entry?.isValidated ?? entry?.validated),
    businessLabel: mapped.businessLabel,
    syncIdentifier: mapped.syncIdentifier,
    syncSourceType: mapped.syncSourceType
  };
};

const buildPayload = async (operation: any, fiscalYearId?: string) => {
  const entree = Number(operation.entree) || 0;
  const sortie = Number(operation.sortie) || 0;
  const isEntree = entree > 0;
  const amount = isEntree ? entree : sortie;

  if (amount <= 0) {
    throw new Error('Le montant de l\'operation doit etre superieur a 0');
  }

  const counterAccount = await resolveTreasuryAccount(operation.mode, fiscalYearId);
  const mainAccount = resolveMainAccount(operation, isEntree, counterAccount);
  const libelleMetier = String(operation.businessLabel || operation.description || '').trim();
  const sync = resolveSyncMeta(operation);
  const lines = isEntree
    ? [
        {
          account: mainAccount,
          debit: amount,
          credit: 0,
          description: libelleMetier
        },
        {
          account: counterAccount,
          debit: 0,
          credit: amount,
          description: libelleMetier
        }
      ]
    : [
        {
          account: mainAccount,
          debit: 0,
          credit: amount,
          description: libelleMetier
        },
        {
          account: counterAccount,
          debit: amount,
          credit: 0,
          description: libelleMetier
        }
      ];

  return {
    ...(fiscalYearId ? { fiscalYearId } : {}),
    date: formatDateISO(operation.date),
    journalType: 'CASH',
    businessLabel: libelleMetier,
    description: libelleMetier,
    pieceNumber: operation.reference || null,
    sync: {
      sourceType: sync.sourceType,
      identifier: sync.identifier
    },
    lines
  };
};

export const journalCaisseService = {
  async getOperations(periode?: string | null) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(periode);

    const data = await withFallback(
      async () =>
        apiClient.request('/accounting/cash-journal', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      async () =>
        apiClient.request('/comptabilite/cash-journal', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      'getJournalCaisse'
    );
    const operations = extractArrayFromResponse(data).map(mapCashEntry);

    return operations.sort((a, b) => {
      const aDate = formatDateISO(a.date);
      const bDate = formatDateISO(b.date);
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  },

  async ajouterOperation(operation: any) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(operation.periode || operation.date);
    const created = await apiClient.request('/accounting/entries', {
      method: 'POST',
      data: await buildPayload(operation, fiscalYearId)
    });

    return mapCashEntry(created);
  },

  async modifierOperation(id: string, operation: any) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(operation.periode || operation.date);
    const updated = await apiClient.request(`/accounting/entries/${id}`, {
      method: 'PUT',
      data: await buildPayload(operation, fiscalYearId)
    });

    return mapCashEntry(updated);
  },

  async supprimerOperation(id: string) {
    await withFallback(
      async () =>
        apiClient.request(`/accounting/entries/${id}`, {
          method: 'DELETE'
        }),
      async () =>
        apiClient.request(`/comptabilite/entries/${id}`, {
          method: 'DELETE'
        }),
      'supprimerJournalCaisse'
    );
  },

  async validerOperation(id: string) {
    const updated = await withFallback(
      async () =>
        apiClient.request(`/accounting/entries/${id}/validate`, {
          method: 'PUT'
        }),
      async () =>
        apiClient.request(`/comptabilite/entries/${id}/validate`, {
          method: 'PUT'
        }),
      'validerJournalCaisse'
    );

    return mapCashEntry(updated);
  },

  async getSolde(periode?: string | null) {
    const operations = await this.getOperations(periode);

    const totalEntrees = operations.reduce((s, op) => s + (op.entree || 0), 0);
    const totalSorties = operations.reduce((s, op) => s + (op.sortie || 0), 0);

    return totalEntrees - totalSorties;
  },

  async getOperationsPeriode(debut: string, fin: string, periode?: string | null) {
    const operations = await this.getOperations(periode);

    return operations.filter((op) => {
      const dateOp = new Date(formatDateISO(op.date));
      const dateDebut = new Date(debut);
      const dateFin = new Date(fin);
      return dateOp >= dateDebut && dateOp <= dateFin;
    });
  }
};
