import React from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import './css/ActionButtons.css';

interface ActionButtonsProps {
  onAdd: () => void;
  onFilter?: () => void;
  onExport?: () => void;
  showFilter?: boolean;
  showExport?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAdd,
  onFilter,
  onExport,
  showFilter = true,
  showExport = true
}) => {
  return (
    <div className="action-buttons">
      <button className="action-btn primary-btn" onClick={onAdd}>
        <Plus size={18} />
        <span>Ajouter</span>
      </button>
      
      {showFilter && onFilter && (
        <button className="action-btn secondary-btn" onClick={onFilter}>
          <Filter size={18} />
          <span>Filtrer</span>
        </button>
      )}
      
      {showExport && onExport && (
        <button className="action-btn secondary-btn" onClick={onExport}>
          <Download size={18} />
          <span>Exporter</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;