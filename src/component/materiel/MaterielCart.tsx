import React from 'react';
import type{ Materiel, EtatMateriel, Livre, CarteSD, Tablette, StockOperation } from '../../types/materiel';

interface MaterielCardProps {
  materiel: Materiel;
  onUpdateEtat: (materielId: string, nouvelEtat: EtatMateriel) => void;
  onManageStock: (materiel: Materiel) => void;
}

const MaterielCard: React.FC<MaterielCardProps> = ({ 
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
          <div className="details-section">
            <h3>Détails du Livre</h3>
            <div className="details-grid">
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
            </div>
            <div className="stock-info">
              <div className="stock-label">Stock actuel:</div>
              <div className={`stock-value ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </div>
            </div>
          </div>
        );

      case 'carte-sd':
        const carteSD = materiel as CarteSD;
        return (
          <div className="details-section">
            <h3>Détails de la Carte SD</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Catégorie:</span>
                <span className="detail-value">{carteSD.categorie}</span>
              </div>
            </div>
            <div className="stock-info">
              <div className="stock-label">Stock actuel:</div>
              <div className={`stock-value ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </div>
            </div>
          </div>
        );

      case 'tablette':
        const tablette = materiel as Tablette;
        return (
          <div className="details-section">
            <h3>Détails de la Tablette</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Nom:</span>
                <span className="detail-value">{tablette.nom}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Numéro de série:</span>
                <span className="detail-value">{tablette.numeroSerie}</span>
              </div>
            </div>
            <div className="stock-info">
              <div className="stock-label">Stock actuel:</div>
              <div className={`stock-value ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="details-section">
            <h3>Détails du Matériel</h3>
            <div className="stock-info">
              <div className="stock-label">Stock actuel:</div>
              <div className={`stock-value ${stock <= 10 ? 'low-stock' : ''}`}>
                {stock} unités
              </div>
            </div>
          </div>
        );
    }
  };

  const renderStockOperations = (materiel: Materiel) => {
    return (
      <div className="stock-operations">
        <h3>Opérations de Stock</h3>
        <div className="operations-header">
          <span>Date</span>
          <span>Type</span>
          <span>Quantité</span>
          <span>Raison</span>
          <span>Description</span>
        </div>
        <div className="operations-list">
          {materiel.stockOperations.map(op => (
            <div key={op.id} className={`operation-row ${op.type}`}>
              <span>{op.date}</span>
              <span className={`operation-type ${op.type}`}>
                {op.type === 'entrée' ? 'Entrée' : 'Sortie'}
              </span>
              <span>{op.quantite}</span>
              <span>{op.raison || 'N/A'}</span>
              <span>{op.description || 'N/A'}</span>
            </div>
          ))}
        </div>
        <button 
          className="btn-add-operation"
          onClick={() => onManageStock(materiel)}
        >
          + Ajouter une opération
        </button>
      </div>
    );
  };

  const stock = calculerStock(materiel);

  return (
    <div className="materiel-card">
      <div className="card-header">
        <h3 className="materiel-name">{materiel.nom}</h3>
        <div className={`etat-badge etat-${materiel.etat.replace(' ', '-')}`}>
          {materiel.etat}
        </div>
      </div>
      
      {renderMaterielDetails(materiel)}
      
      <div className="etat-selector">
        {(['fonctionnel', 'défectueux', 'en réparation', 'inutilisable'] as EtatMateriel[]).map(etatOption => (
          <button
            key={etatOption}
            className={`etat-option ${materiel.etat === etatOption ? 'selected' : ''}`}
            onClick={() => onUpdateEtat(materiel.id, etatOption)}
          >
            {etatOption.charAt(0).toUpperCase() + etatOption.slice(1)}
          </button>
        ))}
      </div>
      
      {renderStockOperations(materiel)}
      
      <div className="card-actions">
        <button 
          className="btn-action btn-stock"
          onClick={() => onManageStock(materiel)}
        >
          Gérer le stock
        </button>
      </div>
    </div>
  );
};

export default MaterielCard;