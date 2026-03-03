import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface DonateurRow {
  nom: string;
  type: 'Physique' | 'Moral';
  montant: number;
  mode: string;
  description: string;
  date: string;
  valide?: boolean;
}

interface DonateursProps {
  searchTerm: string;
  entries: DonateurRow[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onValidate: (index: number) => void;
}

const Donateurs = ({ searchTerm, entries, onEdit, onDelete, onValidate }: DonateursProps) => {
  const term = searchTerm.trim().toLowerCase();
  const filteredDonateurs = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => (!term ? true : `${entry.date} ${entry.nom} ${entry.type} ${entry.mode} ${entry.description}`.toLowerCase().includes(term)));

  return (
    <div className="accounting-table-container">
      <table className="accounting-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Nom complet</th>
            <th>Type</th>
            <th className="table-text-right">Montant</th>
            <th>Mode</th>
            <th>Description</th>
            <th className="table-text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDonateurs.map(({ entry: donateur, index }) => {
            return (
            <tr key={`${donateur.date}-${donateur.nom}`}>
              <td>{donateur.date}</td>
              <td className="table-amount">{donateur.nom}</td>
              <td>
                <span className={`table-badge ${donateur.type === 'Physique' ? 'table-badge--physique' : 'table-badge--moral'}`}>
                  {donateur.type}
                </span>
              </td>
              <td className="table-text-right table-amount-positive">{donateur.montant.toLocaleString()} F</td>
              <td>{donateur.mode}</td>
              <td>{donateur.description}</td>
              <td className="table-text-center">
                <div className="table-actions">
                  <button className="table-action-btn table-action-btn--edit" type="button" onClick={() => onEdit(index)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    className="table-action-btn"
                    type="button"
                    disabled={Boolean(donateur.valide)}
                    title={donateur.valide ? 'Deja valide' : 'Valider'}
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
      </table>
    </div>
  );
};

export default Donateurs;
