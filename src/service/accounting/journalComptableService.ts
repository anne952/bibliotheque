import { apiClient } from '../apiClient';
import { resolveFiscalYearIdFromPeriod } from './fiscalYear';
import { resolveAccountCodeById, resolveAccountIdByNumber } from './accountResolver';
import { withFallback, extractArrayFromResponse } from './withFallback';
import { stripSyncIdentifierSuffix } from './labelSanitizer';
import type { AccountingEntryDTO } from '../../types/accounting';

const formatDateFR = (value: string) => {
  if (!value) return '';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

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

const getPeriode = (date: string) => {
  const [year, month] = formatDateISO(date).split('-');
  return `${Number(month)}/${year}`;
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

const looksLikeOpaqueAccountId = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) return true;
  if (/^[0-9a-f]{24,}$/i.test(trimmed)) return true;
  return false;
};

const toBackendJournalType = (uiJournal?: string) => {
  const value = String(uiJournal || '').trim().toUpperCase();
  if (value === 'ACH') return 'PURCHASE';
  if (value === 'VTE') return 'SALES';
  if (value === 'CAI') return 'CASH';
  if (value === 'BAN') return 'BANK';
  if (value === 'DON') return 'GENERAL';
  return 'GENERAL';
};

const toUiJournalCode = (backendJournal?: string) => {
  const value = String(backendJournal || '').trim().toUpperCase();
  if (value === 'PURCHASE') return 'ACH';
  if (value === 'SALES') return 'VTE';
  if (value === 'CASH') return 'CAI';
  if (value === 'BANK') return 'BAN';
  if (value === 'DONATION') return 'OD';
  return 'OD';
};

const isInvalidDonationJournalTypeError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('journaltype') && message.includes('donation');
};

const isValidatedEntryDeleteError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('deja valide') || message.includes('deja valid') || message.includes('validated');
};

const getLineAccountForWrite = (line: any) => {
  return String(
    line?.accountId ||
    line?.account?.id ||
    line?.accountCode ||
    line?.account?.code ||
    line?.account ||
    ''
  ).trim();
};

const toReversalPayload = (entry: any) => {
  const lines = Array.isArray(entry?.lines) ? entry.lines : [];
  const reversedLines = lines
    .map((line: any) => {
      const account = getLineAccountForWrite(line);
      const debit = Number(line?.debit || 0);
      const credit = Number(line?.credit || 0);
      if (!account) return null;

      return {
        account,
        debit: credit,
        credit: debit,
        description: String(line?.description || entry?.businessLabel || entry?.description || 'Contrepassation automatique')
      };
    })
    .filter((line: any) => line !== null);

  if (reversedLines.length < 2) {
    throw new Error('Contrepassation impossible: lignes comptables insuffisantes.');
  }

  const sourceType = String(entry?.sync?.sourceType || entry?.sourceType || 'MANUAL').trim();
  const sourceId = String(entry?.sync?.identifier || entry?.sourceId || entry?.id || '').trim();

  return {
    fiscalYearId: entry?.fiscalYearId || entry?.fiscalYear?.id || null,
    date: formatDateISO(entry?.date || new Date().toISOString().slice(0, 10)),
    journalType: String(entry?.journalType || 'GENERAL').toUpperCase(),
    businessLabel: `CONTREPASSATION - ${String(entry?.businessLabel || entry?.description || '').trim()}`.trim(),
    description: `CONTREPASSATION - ${String(entry?.businessLabel || entry?.description || '').trim()}`.trim(),
    pieceNumber: entry?.pieceNumber || null,
    sync: {
      sourceType: `${sourceType}_REVERSAL`,
      identifier: sourceId
    },
    lines: reversedLines
  };
};

const resolveFirstAvailableAccount = async (candidates: string[], fiscalYearId?: string) => {
  console.log('[resolveFirstAvailableAccount] Trying candidates:', candidates);
  
  for (const accountNumber of candidates) {
    try {
      console.log(`[resolveFirstAvailableAccount] Attempting to resolve: ${accountNumber}`);
      const resolved = await resolveAccountIdByNumber(accountNumber, fiscalYearId);
      if (resolved) {
        console.log(`[resolveFirstAvailableAccount] ✓ Successfully resolved ${accountNumber} to UUID: ${resolved}`);
        return accountNumber; // Return the account number, not UUID - backend accepts both
      }
    } catch (err) {
      console.log(`[resolveFirstAvailableAccount] ✗ Failed to resolve ${accountNumber}:`, err);
      // try next candidate
    }
  }

  const safeFallback = candidates.find((account) => account !== '521') || candidates[0] || '57';
  console.log('[resolveFirstAvailableAccount] All candidates failed, using fallback:', safeFallback);
  return safeFallback;
};

const resolveCounterAccount = async (ecriture: any, mainAccount: string, fiscalYearId?: string) => {
  const explicitCounterFromUi = String(ecriture.compteContrepartieExplicite || '').trim();
  console.log('[resolveCounterAccount] explicitCounterFromUi:', explicitCounterFromUi);
  
  if (explicitCounterFromUi && explicitCounterFromUi !== mainAccount) {
    console.log('[resolveCounterAccount] Using explicit counterpart from UI:', explicitCounterFromUi);
    return explicitCounterFromUi;
  }

  const explicitCounter = String(
    ecriture.compteContrepartie ||
    ecriture.counterAccount ||
    ecriture.compte_contrepartie ||
    ''
  ).trim();

  if (explicitCounter && explicitCounter !== mainAccount) {
    console.log('[resolveCounterAccount] Using legacy explicit counterpart:', explicitCounter);
    return explicitCounter;
  }

  const journal = String(ecriture.journal || '').trim().toUpperCase();
  console.log('[resolveCounterAccount] Journal type:', journal, '- Using automatic rules');
  
  const rules: Record<string, string[]> = {
    ACH: ['401', '404'],
    VTE: ['411', '412'],
    BAN: ['512', '531', '521'],
    CAI: ['53', '57'],
    OD: ['471']
  };

  const baseCandidates = rules[journal] || ['471'];
  console.log('[resolveCounterAccount] Base candidates for journal', journal, ':', baseCandidates);

  const filteredCandidates = baseCandidates.filter((account) => account !== mainAccount);
  console.log('[resolveCounterAccount] Filtered candidates (excluding main account', mainAccount, '):', filteredCandidates);
  
  return resolveFirstAvailableAccount(filteredCandidates.length ? filteredCandidates : baseCandidates, fiscalYearId);
};

const mapJournalEntry = (entry: any) => {
  const lines = Array.isArray(entry?.lines) ? entry.lines : [];
  const mainLine = lines.find((line: any) => Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0) || lines[0] || {};
  const mapped = fromApiPayload({
    businessLabel: entry?.businessLabel,
    description: entry?.description || mainLine?.description || '',
    sync: entry?.sync,
    sourceType: entry?.sourceType,
    sourceId: entry?.sourceId
  });

  return {
    id: entry?.id,
    date: formatDateFR(entry?.date),
    compte: String(
      mainLine?.accountCode ||
      mainLine?.account?.code ||
      mainLine?.account ||
      mainLine?.accountId ||
      ''
    ),
    libelle: mapped.businessLabel,
    debit: Number(mainLine?.debit || 0),
    credit: Number(mainLine?.credit || 0),
    piece: entry?.pieceNumber || '',
    journal: toUiJournalCode(entry?.journalType),
    periode: getPeriode(entry?.date),
    valide: parseValidated(entry?.isValidated ?? entry?.validated),
    businessLabel: mapped.businessLabel,
    syncIdentifier: mapped.syncIdentifier,
    syncSourceType: mapped.syncSourceType
  };
};

const normalizeMappedEntryAccount = async (entry: any, fiscalYearId?: string) => {
  const compte = String(entry?.compte || '');
  if (!looksLikeOpaqueAccountId(compte)) {
    return entry;
  }

  try {
    const resolvedCode = await resolveAccountCodeById(compte, fiscalYearId);
    if (resolvedCode) {
      return { ...entry, compte: resolvedCode };
    }
  } catch {
    // keep original value
  }

  return entry;
};

const buildPayload = async (ecriture: any, fiscalYearId?: string) => {
  const debit = Number(ecriture.debit) || 0;
  const credit = Number(ecriture.credit) || 0;
  const amount = debit > 0 ? debit : credit;
  const mainAccount = String(ecriture.compte || '').trim();

  if (!mainAccount) {
    throw new Error('Le compte principal doit etre specifie');
  }

  if (amount <= 0) {
    throw new Error('Le montant de l\'ecriture doit etre superieur a 0');
  }

  const counterAccount = await resolveCounterAccount(ecriture, mainAccount, fiscalYearId);
  const libelleMetier = String(ecriture.businessLabel || ecriture.libelle || ecriture.description || '').trim();
  const sync = resolveSyncMeta(ecriture);
  const lines = debit > 0
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
    date: formatDateISO(ecriture.date),
    journalType: toBackendJournalType(ecriture.journal),
    businessLabel: libelleMetier,
    description: libelleMetier,
    pieceNumber: ecriture.piece || null,
    sync: {
      sourceType: sync.sourceType,
      identifier: sync.identifier
    },
    lines
  };
};

export const journalComptableService = {
  async getEcritures(periode?: string) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(periode);

    const data = await withFallback(
      async () =>
        apiClient.request('/accounting/entries', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      async () =>
        apiClient.request('/comptabilite/entries', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      'getEcritures'
    );

    const entriesRaw = extractArrayFromResponse(data).map(mapJournalEntry);
    const entries = await Promise.all(entriesRaw.map((entry) => normalizeMappedEntryAccount(entry, fiscalYearId)));

    if (!periode || /^\d{4}$/.test(periode)) {
      return entries;
    }

    return entries.filter((entry) => entry.periode === periode);
  },

  async ajouterEcriture(ecriture: any) {
    const debit = Number(ecriture.debit) || 0;
    const credit = Number(ecriture.credit) || 0;
    const mainAmount = debit > 0 ? debit : credit;

    if (mainAmount <= 0) {
      throw new Error('Le montant de l\'ecriture doit etre superieur a 0');
    }

    const fiscalYearId = await resolveFiscalYearIdFromPeriod(ecriture.periode || ecriture.date);
    const payload = await buildPayload(ecriture, fiscalYearId);

    let created;
    try {
      created = await withFallback(
        async () =>
          apiClient.request('/accounting/entries', {
            method: 'POST',
            data: payload
          }),
        async () =>
          apiClient.request('/comptabilite/entries', {
            method: 'POST',
            data: payload
          }),
        'ajouterEcriture'
      );
    } catch (error) {
      if (!isInvalidDonationJournalTypeError(error)) {
        throw error;
      }

      const fallbackPayload = { ...payload, journalType: 'GENERAL' };
      created = await withFallback(
        async () =>
          apiClient.request('/accounting/entries', {
            method: 'POST',
            data: fallbackPayload
          }),
        async () =>
          apiClient.request('/comptabilite/entries', {
            method: 'POST',
            data: fallbackPayload
          }),
        'ajouterEcritureFallbackGeneral'
      );
    }

    return normalizeMappedEntryAccount(mapJournalEntry(created), fiscalYearId);
  },

  async modifierEcriture(id: string, ecriture: any) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(ecriture.periode || ecriture.date);
    const payload = await buildPayload(ecriture, fiscalYearId);

    let updated;
    try {
      updated = await withFallback(
        async () =>
          apiClient.request(`/accounting/entries/${id}`, {
            method: 'PUT',
            data: payload
          }),
        async () =>
          apiClient.request(`/comptabilite/entries/${id}`, {
            method: 'PUT',
            data: payload
          }),
        'modifierEcriture'
      );
    } catch (error) {
      if (!isInvalidDonationJournalTypeError(error)) {
        throw error;
      }

      const fallbackPayload = { ...payload, journalType: 'GENERAL' };
      updated = await withFallback(
        async () =>
          apiClient.request(`/accounting/entries/${id}`, {
            method: 'PUT',
            data: fallbackPayload
          }),
        async () =>
          apiClient.request(`/comptabilite/entries/${id}`, {
            method: 'PUT',
            data: fallbackPayload
          }),
        'modifierEcritureFallbackGeneral'
      );
    }

    return normalizeMappedEntryAccount(mapJournalEntry(updated), fiscalYearId);
  },

  async supprimerEcriture(id: string) {
    try {
      await withFallback(
        async () =>
          apiClient.request(`/accounting/entries/${id}`, {
            method: 'DELETE'
          }),
        async () =>
          apiClient.request(`/comptabilite/entries/${id}`, {
            method: 'DELETE'
          }),
        'supprimerEcriture'
      );

      return { mode: 'deleted' as const };
    } catch (error) {
      if (!isValidatedEntryDeleteError(error)) {
        throw error;
      }

      const entry = await withFallback(
        async () => apiClient.request(`/accounting/entries/${id}`),
        async () => apiClient.request(`/comptabilite/entries/${id}`),
        'chargerEcriturePourContrepassation'
      );

      const reversalPayload = toReversalPayload(entry);
      const reversed = await withFallback<any>(
        async () =>
          apiClient.request('/accounting/entries', {
            method: 'POST',
            data: reversalPayload
          }),
        async () =>
          apiClient.request('/comptabilite/entries', {
            method: 'POST',
            data: reversalPayload
          }),
        'creerContrepassation'
      );

      try {
        await withFallback(
          async () =>
            apiClient.request(`/accounting/entries/${reversed?.id}/validate`, {
              method: 'PUT'
            }),
          async () =>
            apiClient.request(`/comptabilite/entries/${reversed?.id}/validate`, {
              method: 'PUT'
            }),
          'validerContrepassation'
        );
      } catch {
        // Keep reversal even if validation step fails.
      }

      return {
        mode: 'reversed' as const,
        reversedId: String(reversed?.id || '')
      };
    }
  },

  async validerEcriture(id: string) {
    const updated = await withFallback(
      async () =>
        apiClient.request(`/accounting/entries/${id}/validate`, {
          method: 'PUT'
        }),
      async () =>
        apiClient.request(`/comptabilite/entries/${id}/validate`, {
          method: 'PUT'
        }),
      'validerEcriture'
    );

    return normalizeMappedEntryAccount(mapJournalEntry(updated));
  },

  async rechercherEcritures(searchTerm: string) {
    const ecritures = await this.getEcritures();
    const term = searchTerm.toLowerCase();
    return ecritures.filter((e) =>
      e.libelle.toLowerCase().includes(term) ||
      e.compte.includes(term) ||
      (e.piece || '').toLowerCase().includes(term)
    );
  }
};
