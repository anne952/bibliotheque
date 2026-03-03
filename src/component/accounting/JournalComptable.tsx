import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface JournalComptableProps {
  searchTerm: string;
  period: string | null;
  entries: JournalEntry[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onValidate: (index: number) => void;
}

interface JournalEntry {
  date: string;
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
  valide?: boolean;
}

const JournalComptable = ({ searchTerm, period, entries, onEdit, onDelete, onValidate }: JournalComptableProps) => {
  void period;
  const term = searchTerm.trim().toLowerCase();

  const filteredEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => (!term ? true : `${entry.date} ${entry.compte} ${entry.libelle}`.toLowerCase().includes(term)));

  const totals = filteredEntries.reduce(
    (acc, { entry }) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit
    }),
    { debit: 0, credit: 0 }
  );

  const balance = totals.debit - totals.credit;
  const isBalanced = Math.abs(balance) < 0.01;

  return (
    <div className="accounting-table-container">
      <table className="accounting-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>N compte</th>
            <th>Libelle</th>
            <th className="table-text-right">Debit</th>
            <th className="table-text-right">Credit</th>
            <th className="table-text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map(({ entry, index }) => {
            return (
            <tr key={`${entry.date}-${entry.compte}-${entry.libelle}-${entry.debit}-${entry.credit}`}>
              <td>{entry.date}</td>
              <td className="table-font-mono">{entry.compte}</td>
              <td>{entry.libelle}</td>
              <td className="table-text-right">{entry.debit.toLocaleString()} F</td>
              <td className="table-text-right">{entry.credit.toLocaleString()} F</td>
                <td className="table-text-center">
                  <div className="table-actions">
                  <button className="table-action-btn table-action-btn--edit" type="button" onClick={() => onEdit(index)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    className="table-action-btn"
                    type="button"
                    disabled={Boolean(entry.valide)}
                    title={entry.valide ? 'Deja validee' : 'Valider'}
                    onClick={() => onValidate(index)}
                  >
                    Valider
                  </button>
                  <button className="table-action-btn table-action-btn--delete" type="button" onClick={() => onDelete(index)}>
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="table-text-right">
              TOTAL
            </td>
            <td className="table-text-right">{totals.debit.toLocaleString()} F</td>
            <td className="table-text-right">{totals.credit.toLocaleString()} F</td>
            <td />
          </tr>
          <tr>
            <td colSpan={3} className="table-text-right">
              BALANCE
            </td>
            <td colSpan={2} className={`table-text-center ${isBalanced ? 'table-amount-positive' : 'table-amount-negative'}`}>
              {balance === 0 ? 'EQUILIBREE' : `${balance.toLocaleString()} F`}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default JournalComptable;
