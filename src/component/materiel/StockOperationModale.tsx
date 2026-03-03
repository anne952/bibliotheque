import React, { useState } from 'react';
import type{ Materiel, StockOperation } from '../../types/materiel';

interface StockOperationModalProps {
  materiel: Materiel;
  onClose: () => void;
  onAddOperation: (materielId: string, operation: StockOperation) => void;
}

const StockOperationModal: React.FC<StockOperationModalProps> = ({ 
  materiel, 
  onClose, 
  onAddOperation 
}) => {
  const [type] = useState<'entrée'>('entrée');
  const [quantite, setQuantite] = useState<number>(1);
  const [raison, setRaison] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nouvelleOperation: StockOperation = {
      id: '',
      date: new Date().toISOString().split('T')[0],
      type,
      quantite,
      raison: raison || undefined,
      description: description || undefined
    };

    onAddOperation(materiel.id, nouvelleOperation);
    onClose();
  };

  const raisonsDisponibles = ['Achat', 'Don', 'Retour', 'Transfert'];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nouvelle Opération de Stock</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type d'opération</label>
            <div className="type-selector">
              <button 
                type="button"
                className="type-btn active"
                disabled
              >
                Entrée
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Quantité *</label>
            <input 
              type="number" 
              min="1"
              value={quantite} 
              onChange={(e) => setQuantite(parseInt(e.target.value))} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Raison</label>
            <select value={raison} onChange={(e) => setRaison(e.target.value)}>
              <option value="">Sélectionnez une raison</option>
              {raisonsDisponibles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description (optionnel)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ex: Dons aux écoles, Vente à la bibliothèque, etc."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-submit">
              Enregistrer l'opération
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockOperationModal;
