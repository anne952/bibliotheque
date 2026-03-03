import { apiClient } from '../apiClient';
import { withFallback } from './withFallback';

type AccountLookup = {
  id: string;
  code: string;
};

const cacheByFiscalYear = new Map<string, Map<string, string>>();

const normalizeCode = (value: unknown) => String(value || '').trim();

const ACCOUNT_ALIASES: Record<string, string[]> = {
  '57': ['531', '571', '572', '573']
};

const toRows = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const toAccountLookup = (row: any): AccountLookup | null => {
  const code = normalizeCode(row?.accountCode || row?.code || row?.compte || row?.accountNumber || row?.number);
  const id = normalizeCode(row?.accountId || row?.id || row?.account?.id);
  if (!code || !id) return null;
  return { id, code };
};

const collectFromPayload = (payload: any) => {
  const rows = toRows(payload);
  return rows
    .map(toAccountLookup)
    .filter((item): item is AccountLookup => item !== null);
};

const collectFromEntriesPayload = (payload: any) => {
  const entries = toRows(payload);
  const out: AccountLookup[] = [];

  for (const entry of entries) {
    const lines = Array.isArray(entry?.lines) ? entry.lines : [];
    for (const line of lines) {
      const item = toAccountLookup({
        accountCode: line?.accountCode || line?.account?.code || line?.accountNumber,
        accountId: line?.accountId || line?.account?.id
      });
      if (item) out.push(item);
    }
  }

  return out;
};

const setCache = (fiscalYearKey: string, accounts: AccountLookup[]) => {
  const map = new Map<string, string>();
  for (const account of accounts) {
    map.set(account.code, account.id);
  }
  cacheByFiscalYear.set(fiscalYearKey, map);
};

const getCache = (fiscalYearKey: string) => cacheByFiscalYear.get(fiscalYearKey);

const setSingleCache = (fiscalYearId: string | undefined, code: string, id: string) => {
  const fiscalYearKey = fiscalYearId || '__none__';
  const existing = getCache(fiscalYearKey) || new Map<string, string>();
  existing.set(code, id);
  cacheByFiscalYear.set(fiscalYearKey, existing);
};

const resolveViaApi = async (accountNumber: string, fiscalYearId?: string) => {
  // Documentation: /accounting/accounts/resolve est principal, /comptabilite/accounts/resolve est alias
  return withFallback(
    async () => {
      const payload = await apiClient.request<any>('/accounting/accounts/resolve', {
        query: {
          accountNumber,
          ...(fiscalYearId ? { fiscalYearId } : {})
        }
      });

      const id = normalizeCode(payload?.id || payload?.accountId || payload?.account?.id);
      const code = normalizeCode(payload?.accountNumber || payload?.accountCode || payload?.code || accountNumber);

      if (id) {
        setSingleCache(fiscalYearId, code, id);
        return id;
      }

      // Si pas de résultat avec fiscalYearId, essayer sans
      if (fiscalYearId) {
        const payloadNoFy = await apiClient.request<any>('/accounting/accounts/resolve', {
          query: { accountNumber }
        });

        const idNoFy = normalizeCode(payloadNoFy?.id || payloadNoFy?.accountId || payloadNoFy?.account?.id);
        const codeNoFy = normalizeCode(
          payloadNoFy?.accountNumber || payloadNoFy?.accountCode || payloadNoFy?.code || accountNumber
        );

        if (idNoFy) {
          setSingleCache(undefined, codeNoFy, idNoFy);
          return idNoFy;
        }
      }

      return null;
    },
    async () => {
      const payload = await apiClient.request<any>('/comptabilite/accounts/resolve', {
        query: {
          accountNumber,
          ...(fiscalYearId ? { fiscalYearId } : {})
        }
      });

      const id = normalizeCode(payload?.id || payload?.accountId || payload?.account?.id);
      const code = normalizeCode(payload?.accountNumber || payload?.accountCode || payload?.code || accountNumber);

      if (id) {
        setSingleCache(fiscalYearId, code, id);
        return id;
      }

      if (fiscalYearId) {
        const payloadNoFy = await apiClient.request<any>('/comptabilite/accounts/resolve', {
          query: { accountNumber }
        });

        const idNoFy = normalizeCode(payloadNoFy?.id || payloadNoFy?.accountId || payloadNoFy?.account?.id);
        const codeNoFy = normalizeCode(
          payloadNoFy?.accountNumber || payloadNoFy?.accountCode || payloadNoFy?.code || accountNumber
        );

        if (idNoFy) {
          setSingleCache(undefined, codeNoFy, idNoFy);
          return idNoFy;
        }
      }

      return null;
    },
    `resolveViaApi(${accountNumber})`
  );
};

const loadAccounts = async (fiscalYearId?: string) => {
  const fiscalYearKey = fiscalYearId || '__none__';
  const cached = getCache(fiscalYearKey);
  if (cached) return cached;

  const endpoints: Array<{ path: string; withFiscalYear: boolean }> = [
    { path: '/accounting/accounts', withFiscalYear: false },
    { path: '/comptabilite/accounts', withFiscalYear: false },
    { path: '/accounting/account-balances', withFiscalYear: true },
    { path: '/accounting/trial-balance', withFiscalYear: true },
    { path: '/accounting/entries', withFiscalYear: true },
    { path: '/accounting/cash-journal', withFiscalYear: true }
  ];

  const collected: AccountLookup[] = [];

  for (const endpoint of endpoints) {
    try {
      const query = endpoint.withFiscalYear && fiscalYearId ? { fiscalYearId } : undefined;
      const payload = await apiClient.request<any>(endpoint.path, { query });
      const chunk = endpoint.path.includes('/entries') || endpoint.path.includes('/cash-journal')
        ? collectFromEntriesPayload(payload)
        : collectFromPayload(payload);
      if (chunk.length > 0) {
        collected.push(...chunk);
      }
    } catch {
      // try next endpoint
    }
  }

  if (collected.length === 0 && fiscalYearId) {
    for (const endpoint of endpoints) {
      try {
        const payload = await apiClient.request<any>(endpoint.path);
        const chunk = endpoint.path.includes('/entries') || endpoint.path.includes('/cash-journal')
          ? collectFromEntriesPayload(payload)
          : collectFromPayload(payload);
        if (chunk.length > 0) {
          collected.push(...chunk);
        }
      } catch {
        // try next endpoint
      }
    }
  }

  setCache(fiscalYearKey, collected);
  return getCache(fiscalYearKey) || new Map<string, string>();
};

export const resolveAccountIdByNumber = async (accountNumber: string, fiscalYearId?: string) => {
  const normalized = normalizeCode(accountNumber);
  if (!normalized) {
    throw new Error('Numero de compte manquant.');
  }

  const directResolved = await resolveViaApi(normalized, fiscalYearId);
  if (directResolved) return directResolved;

  if (fiscalYearId) {
    const directResolvedNoFy = await resolveViaApi(normalized);
    if (directResolvedNoFy) return directResolvedNoFy;
  }

  const accounts = await loadAccounts(fiscalYearId);
  const accountId = accounts.get(normalized);
  if (accountId) return accountId;

  const aliases = ACCOUNT_ALIASES[normalized] || [];
  for (const aliasCode of aliases) {
    const aliasResolved = await resolveViaApi(aliasCode, fiscalYearId);
    if (aliasResolved) return aliasResolved;

    if (fiscalYearId) {
      const aliasResolvedNoFy = await resolveViaApi(aliasCode);
      if (aliasResolvedNoFy) return aliasResolvedNoFy;
    }

    const aliasId = accounts.get(aliasCode);
    if (aliasId) return aliasId;
  }

  const candidates = Array.from(accounts.entries())
    .filter(([code]) => code.startsWith(normalized))
    .map(([code, id]) => ({ code, id }))
    .sort((a, b) => a.code.localeCompare(b.code));

  if (candidates.length === 0 && aliases.length > 0) {
    const aliasCandidates = Array.from(accounts.entries())
      .filter(([code]) => aliases.some((alias) => code.startsWith(alias)))
      .map(([code, id]) => ({ code, id }))
      .sort((a, b) => a.code.localeCompare(b.code));

    if (aliasCandidates.length === 1) {
      return aliasCandidates[0].id;
    }

    if (aliasCandidates.length > 1) {
      return aliasCandidates[0].id;
    }
  }

  if (candidates.length === 1) {
    return candidates[0].id;
  }

  if (candidates.length > 1) {
    return candidates[0].id;
  }

  // Avant de lancer l'erreur, affiche les comptes disponibles pour déboguer
  const allAccounts = Array.from(accounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, id]) => `${code}(${id})`)
    .slice(0, 10)
    .join(', ');
  
  const message = `Compte introuvable pour le numero ${normalized}. Comptes disponibles: ${allAccounts}${accounts.size > 10 ? '...' : ''}`;
  console.error(message);
  throw new Error(message);
};

/**
 * Retourne la liste de tous les comptes disponibles
 * Utile pour remplir des listes déroulantes dans les formulaires
 */
export const getAvailableAccounts = async (fiscalYearId?: string): Promise<Array<{code: string; id: string}>> => {
  const accounts = await loadAccounts(fiscalYearId);
  return Array.from(accounts.entries())
    .map(([code, id]) => ({ code, id }))
    .sort((a, b) => a.code.localeCompare(b.code));
};

export const resolveAccountCodeById = async (accountId: string, fiscalYearId?: string): Promise<string | undefined> => {
  const normalizedId = normalizeCode(accountId);
  if (!normalizedId) return undefined;

  const accounts = await loadAccounts(fiscalYearId);
  for (const [code, id] of accounts.entries()) {
    if (normalizeCode(id) === normalizedId) {
      return code;
    }
  }

  if (fiscalYearId) {
    const accountsNoFy = await loadAccounts(undefined);
    for (const [code, id] of accountsNoFy.entries()) {
      if (normalizeCode(id) === normalizedId) {
        return code;
      }
    }
  }

  return undefined;
};
