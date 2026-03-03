import React from 'react';
import type{ TabType } from '../../types/biblio';
import './css/navbar.css';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'emprunt', label: 'Emprunts' },
    { id: 'visite', label: 'Visiteurs' },
    { id: 'vente', label: 'Ventes' },
    { id: 'dons-financier', label: 'Dons Financiers' },
    { id: 'dons-materiel', label: 'Dons de Matériel' },
    { id: 'achat', label: 'Achats' },
  ] as const;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">Bibliothèque</h1>
        <div className="navbar-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;