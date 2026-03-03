import React from 'react';
import type{ Materiel, EtatMateriel, Livre, CarteSD, Tablette } from '../../types/materiel';



interface MaterielDetailProps {
  materiel: Materiel;
  onUpdateEtat: (materielId: string, nouvelEtat: EtatMateriel) => void;
  onManageStock: () => void;
}

const MaterielDetail: React.FC<MaterielDetailProps> = ({ 
  materiel, 
  onUpdateEtat, 
  onManageStock 
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

  const renderMaterielDetails = (materiel: Materiel) => {
    const stock = calculerStock(materiel);

    switch (materiel.type) {
      case 'livre':
        const livre = materiel as Livre;
        return (
          <div className="details-grid">
            {/* <div className="detail-item">
              <span className="detail-label">Nom:</span>
              <span className="detail-value">{materiel.nom}</span>
            </div> */}
            <div className="detail-item">
              <span className="detail-label">Titre:</span>
              <span className="detail-value">{livre.titre}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Référence:</span>
              <span className="detail-value">{livre.reference}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Volume:</span>
              <span className="detail-value">{livre.volume || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Catégorie:</span>
              <span className="detail-value">{livre.categorie}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Langue:</span>
              <span className="detail-value">{livre.langue}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date d'ajout:</span>
              <span className="detail-value">{livre.dateAjout}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">État:</span>
              <div className="etat-selector">
                <select 
                  value={materiel.etat}
                  onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                  className="etat-select-detail"
                >
                  <option value="fonctionnel">Fonctionnel</option>
                  <option value="défectueux">Défectueux</option>
                  <option value="en réparation">En réparation</option>
                  <option value="inutilisable">Inutilisable</option>
                </select>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-label">Stock actuel:</span>
              <span className={`detail-value stock-display ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </div>
          </div>
        );

      case 'carte-sd':
        const carteSD = materiel as CarteSD;
        return (
          <div className="details-grid">
            {/* <div className="detail-item">
              <span className="detail-label">Nom:</span>
              <span className="detail-value">{materiel.nom}</span>
            </div> */}
            <div className="detail-item">
              <span className="detail-label">Catégorie:</span>
              <span className="detail-value">{carteSD.categorie}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date d'ajout:</span>
              <span className="detail-value">{carteSD.dateAjout}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">État:</span>
              <div className="etat-selector">
                <select 
                  value={materiel.etat}
                  onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                  className="etat-select-detail"
                >
                  <option value="fonctionnel">Fonctionnel</option>
                  <option value="défectueux">Défectueux</option>
                  <option value="en réparation">En réparation</option>
                  <option value="inutilisable">Inutilisable</option>
                </select>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-label">Stock actuel:</span>
              <span className={`detail-value stock-display ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </div>
          </div>
        );

      case 'tablette':
        const tablette = materiel as Tablette;
        return (
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Nom:</span>
              <span className="detail-value">{tablette.nom}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Numéro de série:</span>
              <span className="detail-value">{tablette.numeroSerie}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date d'ajout:</span>
              <span className="detail-value">{tablette.dateAjout}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">État:</span>
              <div className="etat-selector">
                <select 
                  value={materiel.etat}
                  onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                  className="etat-select-detail"
                >
                  <option value="fonctionnel">Fonctionnel</option>
                  <option value="défectueux">Défectueux</option>
                  <option value="en réparation">En réparation</option>
                  <option value="inutilisable">Inutilisable</option>
                </select>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-label">Stock actuel:</span>
              <span className={`detail-value stock-display ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </div>
          </div>
        );

      default:
        return (
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Nom:</span>
              <span className="detail-value">{materiel.nom}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{materiel.type}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date d'ajout:</span>
              <span className="detail-value">{materiel.dateAjout}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">État:</span>
              <div className="etat-selector">
                <select 
                  value={materiel.etat}
                  onChange={(e) => onUpdateEtat(materiel.id, e.target.value as EtatMateriel)}
                  className="etat-select-detail"
                >
                  <option value="fonctionnel">Fonctionnel</option>
                  <option value="défectueux">Défectueux</option>
                  <option value="en réparation">En réparation</option>
                  <option value="inutilisable">Inutilisable</option>
                </select>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-label">Stock actuel:</span>
              <span className={`detail-value stock-display ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </span>
            </div>
          </div>
        );
    }
  };

  const renderStockOperations = (materiel: Materiel) => {
    const stock = calculerStock(materiel);
    const entreeOperations = materiel.stockOperations.filter(op => op.type === 'entrée');
    
    return (
      <div className="stock-section">
        <div className="section-header">
          <h3>Entrées de Stock</h3>
          <div className="stock-summary">
            <span className="stock-label">Stock total:</span>
            <span className={`stock-value ${stock <= 10 ? 'low-stock' : ''}`}>
              {stock} unités
            </span>
          </div>
          <button 
            className="btn-stock-action"
            onClick={onManageStock}
          >
            + Nouvelle entrée
          </button>
        </div>
        
        <div className="operations-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Quantité</th>
                <th>Raison</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {entreeOperations.length > 0 ? (
                entreeOperations.map(op => (
                  <tr key={op.id} className="operation-entrée">
                    <td>{op.date}</td>
                    <td>{op.quantite}</td>
                    <td>{op.raison || 'N/A'}</td>
                    <td>{op.description || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="empty-message">Aucune entrée enregistrée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="materiel-detail">
      <div className="detail-header">
        <h2 className="detail-title">{materiel.nom}</h2>
        <div className={`etat-badge etat-${materiel.etat.replace(' ', '-')}`}>
          {materiel.etat}
        </div>
      </div>

      <div className="detail-sections">
        <div className="info-section">
          <h3>Informations Générales</h3>
          {renderMaterielDetails(materiel)}
        </div>

        <div className="stock-section">
          {renderStockOperations(materiel)}
        </div>
      </div>
    </div>
  );
};

export default MaterielDetail;