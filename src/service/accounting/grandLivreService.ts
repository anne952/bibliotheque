import { apiClient } from '../apiClient';
import { resolveFiscalYearIdFromPeriod } from './fiscalYear';
import { withFallback, extractArrayFromResponse } from './withFallback';
import { stripSyncIdentifierSuffix } from './labelSanitizer';

const mapOperations = (operations: any[] = [], initialBalance = 0) => {
  let solde = Number(initialBalance || 0);

  return operations.map((op) => {
    const debit = Number(op.debit || 0);
    const credit = Number(op.credit || 0);
    solde += debit - credit;

    return {
      date: op.date || '',
      libelle: stripSyncIdentifierSuffix(op.description || op.libelle || ''),
      piece: op.pieceNumber || op.piece || '',
      debit,
      credit,
      solde
    };
  });
};

export const grandLivreService = {
  async getGrandLivre(periode?: string | null, comptesFiltres: string[] = []) {
    const fiscalYearId = await resolveFiscalYearIdFromPeriod(periode);

    const accountBalancesRaw = await withFallback(
      async () =>
        apiClient.request('/accounting/account-balances', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      async () =>
        apiClient.request('/comptabilite/account-balances', {
          query: fiscalYearId ? { fiscalYearId } : undefined
        }),
      'getGrandLivre (account-balances)'
    );

    const accountBalances = extractArrayFromResponse(accountBalancesRaw);

    const filtered = comptesFiltres.length > 0
      ? accountBalances.filter((acc: any) => comptesFiltres.includes(String(acc.accountCode || acc.code || acc.compte || '')))
      : accountBalances;

    const entries = await Promise.all(
      filtered.map(async (acc: any) => {
        const accountId = acc.accountId || acc.id || acc.accountCode || acc.code;
        const ledger = await withFallback(
          async () =>
            apiClient.request('/accounting/general-ledger', {
              query: {
                accountId: String(accountId),
                ...(fiscalYearId ? { fiscalYearId } : {})
              }
            }),
          async () =>
            apiClient.request('/comptabilite/general-ledger', {
              query: {
                accountId: String(accountId),
                ...(fiscalYearId ? { fiscalYearId } : {})
              }
            }),
          `getGrandLivre (general-ledger for ${accountId})`
        );

        const rawOperations = extractArrayFromResponse(ledger);

        const soldeInitial = Number(acc.initialBalance || 0);
        const operations = mapOperations(rawOperations, soldeInitial);
        const totalDebit = operations.reduce((s, o) => s + o.debit, 0);
        const totalCredit = operations.reduce((s, o) => s + o.credit, 0);

        return {
          compte: String(acc.accountCode || acc.code || acc.compte || ''),
          intitule: stripSyncIdentifierSuffix(acc.accountName || acc.name || acc.intitule || ''),
          soldeInitial,
          operations,
          totalDebit,
          totalCredit,
          soldeFinal: Number(acc.balance || (operations[operations.length - 1]?.solde ?? soldeInitial))
        };
      })
    );

    return entries.sort((a, b) => a.compte.localeCompare(b.compte));
  },

  async ajouterOperation(compte: string, operation: unknown) {
    void compte;
    void operation;
    throw new Error('Ajout direct dans le grand livre non supporte: creez une ecriture comptable');
  },

  async modifierOperation(compte: string, index: number, operation: unknown) {
    void compte;
    void index;
    void operation;
    throw new Error('Modification directe dans le grand livre non supportee: modifiez l\'ecriture source');
  },

  async supprimerOperation(compte: string, index: number) {
    void compte;
    void index;
    throw new Error('Suppression directe dans le grand livre non supportee: supprimez l\'ecriture source');
  },

  async rechercher(periode: string | null | undefined, searchTerm: string) {
    const grandLivre = await this.getGrandLivre(periode);

    const term = searchTerm.toLowerCase();

    return grandLivre.filter((compte) =>
      compte.compte.includes(term) ||
      compte.intitule.toLowerCase().includes(term) ||
      compte.operations.some((op: any) =>
        op.libelle.toLowerCase().includes(term) ||
        op.piece.toLowerCase().includes(term)
      )
    );
  }
};
