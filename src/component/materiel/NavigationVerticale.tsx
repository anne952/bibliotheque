import React from 'react';
import type{ TypeMateriel } from '../../types/materiel';

interface NavigationVerticaleProps {
  selectedType: TypeMateriel;
  onTypeSelect: (type: TypeMateriel) => void;
  onAddMateriel: () => void;
}

const NavigationVerticale: React.FC<NavigationVerticaleProps> = ({ 
  selectedType, 
  onTypeSelect, 
  onAddMateriel 
}) => {
  const navItems = [
    { type: 'livre' as TypeMateriel, label: ' Livres' },
    { type: 'carte-sd' as TypeMateriel, label: ' Cartes SD' },
    { type: 'tablette' as TypeMateriel, label: ' Tablettes' },
    { type: 'photocopieuse' as TypeMateriel, label: ' Photocopieuses' },
    { type: 'autre' as TypeMateriel, label: ' Autre Matériel' },
  ];

  return (
    <nav className="navbar-horizontal">
      <div className="navbar-top">
        <div className="navbar-header">
          <h1> Gestion de Matériel</h1>
          <p>Gérez vos stocks et états de matériel</p>
        </div>
        
        <button className="add-btn-nav" onClick={onAddMateriel}>
          + Ajouter un Matériel
        </button>
      </div>
      
      <div className="nav-items">
        {navItems.map((item) => (
          <button
            key={item.type}
            className={`nav-item ${selectedType === item.type ? 'active' : ''}`}
            onClick={() => onTypeSelect(item.type)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavigationVerticale;
