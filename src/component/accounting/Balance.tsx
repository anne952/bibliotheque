import { useMemo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useBalanceQuery } from '../../hooks/queries/accountingQueries';

interface BalanceHeaderRow {
  isHeader: true;
  classe: string;
}

interface BalanceDataRow {
  isHeader: false;
  compte: string;
  intitule: string;
  totalDebit: number;
  totalCredit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

type BalanceRow = BalanceHeaderRow | BalanceDataRow;

interface BalanceProps {
  searchTerm: string;
  period: string | null;
}

const isHeaderRow = (row: BalanceRow): row is BalanceHeaderRow => row.isHeader;

const Balance = ({ searchTerm, period }: BalanceProps) => {
  const balanceQuery = useBalanceQuery(period);
  const rows = (balanceQuery.data as BalanceRow[]) || [];
  const loading = balanceQuery.isLoading;
  const error = (balanceQuery.error as Error | null)?.message ?? null;

  const term = searchTerm.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!term) {
      return rows;
    }

    return rows.filter((item) => {
      if (isHeaderRow(item)) {
        return item.classe.toLowerCase().includes(term);
      }

      return `${item.compte} ${item.intitule}`.toLowerCase().includes(term);
    });
  }, [rows, term]);

  const totals = filteredRows
    .filter((item): item is BalanceDataRow => !item.isHeader)
    .reduce(
      (acc, item) => ({
        totalDebit: acc.totalDebit + item.totalDebit,
        totalCredit: acc.totalCredit + item.totalCredit,
        soldeDebiteur: acc.soldeDebiteur + item.soldeDebiteur,
        soldeCrediteur: acc.soldeCrediteur + item.soldeCrediteur
      }),
      { totalDebit: 0, totalCredit: 0, soldeDebiteur: 0, soldeCrediteur: 0 }
    );

  const isBalanced = Math.abs(totals.totalDebit - totals.totalCredit) < 0.01;

  return (
    <>
      {error && <div className="accounting-empty">{error}</div>}
      {loading && <div className="accounting-empty">Chargement de la balance...</div>}
      {!loading && !error && filteredRows.length === 0 && (
        <div className="accounting-empty">
          Aucune ecriture trouvee pour cet exercice. Seules les ecritures validees alimentent la balance.
        </div>
      )}

      {!loading && (
        <div className="accounting-table-container">
          <table className="accounting-table">
            <thead>
              <tr>
                <th>N Compte</th>
                <th>Intitule</th>
                <th className="table-text-right">Total Debit</th>
                <th className="table-text-right">Total Credit</th>
                <th className="table-text-right">Solde Debiteur</th>
                <th className="table-text-right">Solde Crediteur</th>
                <th className="table-text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item, index) =>
                isHeaderRow(item) ? (
                  <tr key={`header-${item.classe}-${index}`} className="balance-header-row">
                    <td colSpan={7}>{item.classe}</td>
                  </tr>
                ) : (
                  <tr key={`${item.compte}-${index}`}>
                    <td className="table-font-mono">{item.compte}</td>
                    <td>{item.intitule}</td>
                    <td className="table-text-right">{item.totalDebit.toLocaleString()} F</td>
                    <td className="table-text-right">{item.totalCredit.toLocaleString()} F</td>
                    <td className="table-text-right table-amount-positive">{item.soldeDebiteur > 0 ? `${item.soldeDebiteur.toLocaleString()} F` : '-'}</td>
                    <td className="table-text-right table-amount-positive">{item.soldeCrediteur > 0 ? `${item.soldeCrediteur.toLocaleString()} F` : '-'}</td>
                    <td className="table-text-center">
                      <div className="table-actions">
                        <button className="table-action-btn table-action-btn--edit" type="button" disabled title="Edition non disponible ici">
                          <FiEdit2 size={16} />
                        </button>
                        <button className="table-action-btn table-action-btn--delete" type="button" disabled title="Suppression non disponible ici">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="table-text-right">
                  TOTAUX
                </td>
                <td className="table-text-right">{totals.totalDebit.toLocaleString()} F</td>
                <td className="table-text-right">{totals.totalCredit.toLocaleString()} F</td>
                <td className="table-text-right table-amount-positive">{totals.soldeDebiteur.toLocaleString()} F</td>
                <td className="table-text-right table-amount-positive">{totals.soldeCrediteur.toLocaleString()} F</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className={`balance-equilibre ${isBalanced ? 'balance-equilibre--ok' : 'balance-equilibre--ko'}`}>
        {isBalanced
          ? 'BALANCE EQUILIBREE'
          : `BALANCE NON EQUILIBREE (Ecart: ${(totals.totalDebit - totals.totalCredit).toLocaleString()} F)`}
      </div>
    </>
  );
};

export default Balance;
