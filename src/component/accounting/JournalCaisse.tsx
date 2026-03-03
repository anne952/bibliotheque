import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface JournalCaisseProps {
  searchTerm: string;
  entries: CaisseEntry[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onValidate: (index: number) => void;
}

interface CaisseEntry {
  date: string;
  description: string;
  reference: string;
  entree: number;
  sortie: number;
  valide?: boolean;
}

const JournalCaisse = ({ searchTerm, entries, onEdit, onDelete, onValidate }: JournalCaisseProps) => {
  const term = searchTerm.trim().toLowerCase();
  const filteredEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => (!term ? true : `${entry.date} ${entry.description} ${entry.reference}`.toLowerCase().includes(term)));

  const totals = filteredEntries.reduce(
    (acc, { entry }) => ({
      entree: acc.entree + entry.entree,
      sortie: acc.sortie + entry.sortie
    }),
    { entree: 0, sortie: 0 }
  );

  const solde = totals.entree - totals.sortie;

  return (
    <>
      <div className="accounting-table-container">
        <table className="accounting-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Reference</th>
              <th className="table-text-right">Entree</th>
              <th className="table-text-right">Sortie</th>
              <th className="table-text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(({ entry, index }) => {
              return (
              <tr key={`${entry.date}-${entry.reference}-${entry.description}`}>
                <td>{entry.date}</td>
                <td>{entry.description}</td>
                <td className="table-font-mono">{entry.reference}</td>
                <td className="table-text-right table-amount-positive">{entry.entree > 0 ? `${entry.entree.toLocaleString()} F` : '-'}</td>
                <td className="table-text-right table-amount-negative">{entry.sortie > 0 ? `${entry.sortie.toLocaleString()} F` : '-'}</td>
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
              <td className="table-text-right table-amount-positive">{totals.entree.toLocaleString()} F</td>
              <td className="table-text-right table-amount-negative">{totals.sortie.toLocaleString()} F</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="caisse-solde">
        <span className="caisse-solde__label">Solde caisse</span>
        <span className={`caisse-solde__amount ${solde >= 0 ? 'caisse-solde__amount--positif' : 'caisse-solde__amount--negatif'}`}>
          {solde.toLocaleString()} F
        </span>
      </div>
    </>
  );
};

export default JournalCaisse;
