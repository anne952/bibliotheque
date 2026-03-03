import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import type{ TabType, Emprunt, Visiteur, Vente, DonFinancier, DonMateriel, Achat } from '../../types/biblio';
import './css/DataTable.css';

interface DataTableProps<T> {
  data: T[];
  type: TabType;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onView?: (item: T) => void;
}

const DataTable: React.FC<DataTableProps<any>> = ({ 
  data, 
  type, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const getHeaders = () => {
    switch (type) {
      case 'emprunt':
        return ['Nom', 'Prénom', 'Livres', 'Date Emprunt', 'Date Retour', 'Actions'];
      case 'visite':
        return ['Nom', 'Prénom', 'Adresse', 'Église', 'Date Visite', 'Actions'];
      case 'vente':
        return ['Titre', 'Référence', 'Nom', 'Prénom', 'Montant', 'Date', 'Actions'];
      case 'dons-financier':
        return ['Donateur', 'Type', 'Montant', 'Mode', 'Date', 'Description', 'Actions'];
      case 'dons-materiel':
        return ['Type Matériel', 'Matériel', 'Quantité', 'Institution', 'Date', 'Actions'];
      case 'achat':
        return ['Intitulé', 'Montant', 'Date', 'Fournisseur', 'Actions'];
      default:
        return [];
    }
  };

  const renderCell = (item: any, header: string) => {
    switch (header) {
      case 'Nom':
        return item.nom || item.donateur?.split(' ')[0] || '-';
      case 'Prénom':
        return item.prenom || item.donateur?.split(' ')[1] || '-';
      case 'Titre Ouvrage':
      case 'Titre':
        return item.titreOuvrage || item.titre || item.materiel || '-';
      case 'Livres':
        return item.livres?.map((l: any) => `${l.titre} (${l.quantite})`).join(', ') || '-';
      case 'Référence':
        return item.reference || '-';
      case 'Date Emprunt':
      case 'Date Visite':
      case 'Date':
        return new Date(item.dateEmprunt || item.dateVisite || item.dateVente || item.dateDon || item.dateAchat).toLocaleDateString('fr-FR');
      case 'Date Retour':
        return new Date(item.dateRetour).toLocaleDateString('fr-FR');
      case 'Adresse':
        return item.adresse || '-';
      case 'Église':
        return item.egliseProvenance || '-';
      case 'Montant':
        return `${(item.montant || 0).toLocaleString('fr-FR')} FCFA`;
      case 'Intitulé':
        return item.intitule || '-';
      case 'Donateur':
        return item.donateur || '-';
      case 'Fournisseur':
        return item.fournisseur || '-';
      case 'Type Matériel':
        return item.typeMateriel || '-';
      case 'Matériel':
        return item.materiel || '-';
      case 'Quantité':
        return item.quantite || '-';
      case 'Institution':
        return item.institutionDestinaire || '-';
      case 'Type':
        const typeLabels: { [key: string]: string } = {
          'physique': 'Personne Physique',
          'moral': 'Personne Morale'
        };
        return typeLabels[item.type] || item.type || '-';
      case 'Mode':
        const modeLabels: { [key: string]: string } = {
          'espece': 'Espèce',
          'cheque': 'Chèque',
          'virement': 'Virement',
          'nature': 'Nature'
        };
        return modeLabels[item.mode] || item.mode || '-';
      case 'Description':
        return item.description || '-';
      case 'Actions':
        return (
          <div className="table-actions">
            {onView && (
              <button className="action-btn view-btn" onClick={() => onView(item)}>
                <Eye size={16} />
              </button>
            )}
            <button className="action-btn edit-btn" onClick={() => onEdit(item)}>
              <Edit2 size={16} />
            </button>
            <button className="action-btn delete-btn" onClick={() => onDelete(item.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        );
      default:
        return item[header.toLowerCase()] || '-';
    }
  };

  const headers = getHeaders();

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="table-header">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, rowIndex) => (
              <tr key={item.id || rowIndex} className="table-row">
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="table-cell">
                    {renderCell(item, header)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="table-empty">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;