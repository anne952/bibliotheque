import React from 'react';
import type{ Materiel, TypeMateriel, EtatMateriel, Livre, CarteSD, Tablette } from '../../types/materiel';

interface MaterielTableProps {
  materiels: Materiel[];
  type: TypeMateriel;
  onSelectMateriel: (materiel: Materiel) => void;
  onUpdateEtat: (materielId: string, nouvelEtat: EtatMateriel) => void;
  onManageStock: (materiel: Materiel) => void;
  onDeleteMateriel: (materielId: string) => void;
  selectedMaterialIds: string[];
  onToggleMaterialSelection: (materielId: string) => void;
}

const MaterielTable: React.FC<MaterielTableProps> = ({ 
  materiels, 
  type,
  onSelectMateriel, 
  onUpdateEtat,
  onManageStock,
  onDeleteMateriel,
  selectedMaterialIds,
  onToggleMaterialSelection
}) => {
  const calculerStock = (materiel: Materiel): number => {
    let stock = 0;
    materiel.stockOperations.forEach(op => {
      if (op.type === 'entrée') {
        stock += op.quantite;
      } else {
        stock -= op.quantite;
      }
    });
    return stock;
  };

  const getEtatColor = (etat: EtatMateriel) => {
    switch (etat) {
      case 'fonctionnel': return 'green';
      case 'défectueux': return 'red';
      case 'en réparation': return 'orange';
      case 'inutilisable': return 'gray';
      default: return 'blue';
    }
  };

  const renderTableHeaders = () => {
    switch (type) {
      case 'livre':
        return (
          <>
            <th>Titre</th>
            <th>Référence</th>
            <th>Volume</th>
            <th>Langue</th>
            <th>Date d'ajout</th>
            <th>État</th>
            <th>Stock</th>
            <th>Actions</th>
          </>
        );
      case 'carte-sd':
        return (
          <>
            
            <th>Catégorie</th>
            <th>Date d'ajout</th>
            <th>État</th>
            <th>Stock</th>
            <th>Actions</th>
          </>
        );
      case 'tablette':
        return (
          <>
            <th>Nom</th>
            <th>Numéro de série</th>
            <th>Date d'ajout</th>
            <th>État</th>
            <th>Stock</th>
            <th>Actions</th>
          </>
        );
      default:
        return (
          <>
            <th>Nom</th>
            <th>Type</th>
            <th>Date d'ajout</th>
            <th>État</th>
            <th>Stock</th>
            <th>Actions</th>
          </>
        );
    }
  };

  const renderRowActions = (materiel: Materiel) => {
    const isSelected = selectedMaterialIds.includes(materiel.id);

    return (
      <div className="table-actions">
        <button 
          className="btn-action btn-view"
          onClick={() => onSelectMateriel(materiel)}
          title="Voir les détails"
        >
          Voir plus
        </button>
        <button
          className={`btn-action ${isSelected ? 'btn-selected' : 'btn-select'}`}
          onClick={() => onToggleMaterialSelection(materiel.id)}
          title="Sélectionner pour suppression groupée"
        >
          {isSelected ? 'Sélectionné' : 'Sélectionner'}
        </button>
        <button 
          className="btn-action btn-delete"
          onClick={() => onDeleteMateriel(materiel.id)}
          title="Supprimer ce matériel"
        >
          Supprimer
        </button>
      </div>
    );
  };

  const renderTableRow = (materiel: Materiel) => {
    const stock = calculerStock(materiel);

    switch (type) {
      case 'livre':
        const livre = materiel as Livre;
        return (
          <tr key={materiel.id}>
            <td className="cell-title">
              <button 
                className="btn-view"
                onClick={() => onSelectMateriel(materiel)}
              >
                {livre.titre}
              </button>
            </td>
            <td>{livre.reference}</td>
            <td>{livre.volume ? `Vol. ${livre.volume}` : '-'}</td>
            <td>{livre.langue}</td>
            <td>{livre.dateAjout}</td>
            <td>
              <select 
                value={materiel.etat}
                onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                className={`etat-select etat-${getEtatColor(materiel.etat)}`}
              >
                <option value="fonctionnel">Fonctionnel</option>
                <option value="défectueux">Défectueux</option>
                <option value="en réparation">En réparation</option>
                <option value="inutilisable">Inutilisable</option>
              </select>
            </td>
            <td>
              <span className={`stock-cell ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </td>
            <td>
              {renderRowActions(materiel)}
            </td>
          </tr>
        );

      case 'carte-sd':
        const carteSD = materiel as CarteSD;
        return (
          <tr key={materiel.id}>
            <td className="cell-title">
              <button 
                className="btn-view"
                onClick={() => onSelectMateriel(materiel)}
              >
                {carteSD.categorie}
              </button>
            </td>
            
            <td>{carteSD.dateAjout}</td>
            <td>
              <select 
                value={materiel.etat}
                onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                className={`etat-select etat-${getEtatColor(materiel.etat)}`}
              >
                <option value="fonctionnel">Fonctionnel</option>
                <option value="défectueux">Défectueux</option>
                <option value="en réparation">En réparation</option>
                <option value="inutilisable">Inutilisable</option>
              </select>
            </td>
            <td>
              <span className={`stock-cell ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </td>
            <td>
              {renderRowActions(materiel)}
            </td>
          </tr>
        );

      case 'tablette':
        const tablette = materiel as Tablette;
        return (
          <tr key={materiel.id}>
            <td className="cell-title">
              <button 
                className="btn-view"
                onClick={() => onSelectMateriel(materiel)}
              >
                {tablette.nom}
              </button>
            </td>
            <td>{tablette.numeroSerie}</td>
            <td>{tablette.dateAjout}</td>
            <td>
              <select 
                value={materiel.etat}
                onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                className={`etat-select etat-${getEtatColor(materiel.etat)}`}
              >
                <option value="fonctionnel">Fonctionnel</option>
                <option value="défectueux">Défectueux</option>
                <option value="en réparation">En réparation</option>
                <option value="inutilisable">Inutilisable</option>
              </select>
            </td>
            <td>
              <span className={`stock-cell ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </td>
            <td>
              {renderRowActions(materiel)}
            </td>
          </tr>
        );

      default:
        return (
          <tr key={materiel.id}>
            <td className="cell-title">
              <button 
                className="btn-view"
                onClick={() => onSelectMateriel(materiel)}
              >
                {materiel.nom}
              </button>
            </td>
            <td>{materiel.type}</td>
            <td>{materiel.dateAjout}</td>
            <td>
              <select 
                value={materiel.etat}
                onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                className={`etat-select etat-${getEtatColor(materiel.etat)}`}
              >
                <option value="fonctionnel">Fonctionnel</option>
                <option value="défectueux">Défectueux</option>
                <option value="en réparation">En réparation</option>
                <option value="inutilisable">Inutilisable</option>
              </select>
            </td>
            <td>
              <span className={`stock-cell ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </td>
            <td>
              {renderRowActions(materiel)}
            </td>
          </tr>
        );
    }
  };

  if (materiels.length === 0) {
    return (
      <div className="empty-state">
        <h3>Aucun matériel trouvé</h3>
        <p>Il n'y a pas de matériel de ce type dans votre inventaire.</p>
        <button 
          className="btn-submit"
          onClick={() => window.dispatchEvent(new CustomEvent('openAddModal'))}
          style={{marginTop: '20px'}}
        >
          + Ajouter votre premier matériel
        </button>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-responsive">
        <table className="materiel-table">
          <thead>
            <tr>
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody>
            {materiels.map(renderTableRow)}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span className="total-count">
          Total: {materiels.length} élément(s)
        </span>
      </div>
    </div>
  );
};

export default MaterielTable;