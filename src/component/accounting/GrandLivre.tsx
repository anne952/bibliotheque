import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { grandLivreService } from '../../service/accounting/grandLivreService';

interface GrandLivreOperation {
  date: string;
  libelle: string;
  piece: string;
  debit: number;
  credit: number;
  solde: number;
}

interface GrandLivreAccount {
  compte: string;
  intitule: string;
  soldeInitial: number;
  operations: GrandLivreOperation[];
  totalDebit: number;
  totalCredit: number;
}

interface GrandLivreProps {
  searchTerm: string;
  period: string | null;
}

const GrandLivre = ({ searchTerm, period }: GrandLivreProps) => {
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<GrandLivreAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGrandLivre = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await grandLivreService.getGrandLivre(period || undefined);
        setAccounts(data as GrandLivreAccount[]);

        const defaults = (data as GrandLivreAccount[])
          .filter((acc) => ['5', '6', '7'].includes(acc.compte.charAt(0)))
          .slice(0, 5)
          .map((acc) => acc.compte);
        setExpandedAccounts(defaults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chargement du grand livre impossible');
      } finally {
        setLoading(false);
      }
    };

    void loadGrandLivre();
  }, [period]);

  const term = searchTerm.trim().toLowerCase();

  const filteredAccounts = useMemo(() => {
    if (!term) {
      return accounts;
    }

    return accounts.filter((account) => {
      if (`${account.compte} ${account.intitule}`.toLowerCase().includes(term)) {
        return true;
      }

      return account.operations.some((op) =>
        `${op.date} ${op.libelle} ${op.piece}`.toLowerCase().includes(term)
      );
    });
  }, [accounts, term]);

  const toggleAccount = (compte: string) => {
    setExpandedAccounts((prev) => (prev.includes(compte) ? prev.filter((c) => c !== compte) : [...prev, compte]));
  };

  return (
    <div>
      {error && <div className="accounting-empty">{error}</div>}
      {loading && <div className="accounting-empty">Chargement du grand livre...</div>}

      {!loading && filteredAccounts.length === 0 && (
        <div className="accounting-empty">
          Aucune operation trouvee pour cet exercice. Verifiez la periode et validez les ecritures.
        </div>
      )}

      {!loading && filteredAccounts.map((account) => {
        const isExpanded = expandedAccounts.includes(account.compte);
        const finalSolde = account.operations[account.operations.length - 1]?.solde ?? account.soldeInitial;

        return (
          <div key={account.compte} className="grand-livre-account">
            <div className="grand-livre-account__header" onClick={() => toggleAccount(account.compte)}>
              <div className="grand-livre-account__title">
                <span className={`grand-livre-account__icon ${isExpanded ? 'grand-livre-account__icon--expanded' : ''}`}>
                  {isExpanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                </span>
                <span className="grand-livre-account__code">{account.compte}</span>
                <span className="grand-livre-account__label">{account.intitule}</span>
              </div>
              <div className="grand-livre-account__solde">
                <span className="grand-livre-account__solde-label">Solde: {finalSolde.toLocaleString()} F</span>
                <div className="grand-livre-account__actions">
                  <button className="table-action-btn table-action-btn--edit" type="button" disabled title="Edition non disponible ici">
                    <FiEdit2 size={16} />
                  </button>
                  <button className="table-action-btn table-action-btn--delete" type="button" disabled title="Suppression non disponible ici">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="grand-livre-account__content">
                <div className="accounting-table-container">
                  <table className="accounting-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Libelle</th>
                        <th>Piece</th>
                        <th className="table-text-right">Debit</th>
                        <th className="table-text-right">Credit</th>
                        <th className="table-text-right">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>-</td>
                        <td>Solde initial</td>
                        <td />
                        <td className="table-text-right" />
                        <td className="table-text-right" />
                        <td className="table-text-right table-amount">{account.soldeInitial.toLocaleString()} F</td>
                      </tr>
                      {account.operations.map((op, idx) => (
                        <tr key={`${account.compte}-${idx}-${op.date}`}>
                          <td>{op.date}</td>
                          <td>{op.libelle}</td>
                          <td className="table-font-mono">{op.piece}</td>
                          <td className="table-text-right">{op.debit > 0 ? `${op.debit.toLocaleString()} F` : '-'}</td>
                          <td className="table-text-right">{op.credit > 0 ? `${op.credit.toLocaleString()} F` : '-'}</td>
                          <td className="table-text-right table-amount">{op.solde.toLocaleString()} F</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="table-text-right">
                          TOTAL
                        </td>
                        <td className="table-text-right">{account.totalDebit.toLocaleString()} F</td>
                        <td className="table-text-right">{account.totalCredit.toLocaleString()} F</td>
                        <td className="table-text-right table-amount">{finalSolde.toLocaleString()} F</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GrandLivre;
