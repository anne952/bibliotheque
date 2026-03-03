import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  item: { id: string; type: string; name: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  item,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Confirmer la suppression</h3>
          <button className="modal-close" onClick={onCancel}>
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          <p>
            Êtes-vous sûr de vouloir supprimer <strong>{item.name}</strong> ({item.type}) ?
          </p>
          <p className="modal-warning">
            ⚠️ L'élément sera placé dans les suppressions récentes pendant 30 jours avant d'être définitivement supprimé.
          </p>
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Confirmer la suppression
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;