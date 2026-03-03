import  { useState } from 'react';
import { Search, Book, Users, Gift, ShoppingCart, Calendar, Phone, Mail, Home, Church } from 'lucide-react';
import type{ Emprunt, Visiteur, Vente, Don, Achat } from '../types/library';
import '../pages/principales/css/library.css';

const Library = () => {
  const [activeTab, setActiveTab] = useState<'emprunts' | 'visiteurs' | 'ventes' | 'dons' | 'achats'>('emprunts');

  // Données de démonstration
  const empruntsData: Emprunt[] = [
    {
      id: 1,
      nom: "Martin",
      prenom: "Pierre",
      dateEmprunt: "2024-01-15",
      telephone: "06 12 34 56 78",
      email: "pierre.martin@email.com",
      titreOuvrage: "La Bible de Jérusalem",
      reference: "BIB-001",
      dureeEmprunt: "2 semaines",
      nombreOuvrage: 1,
      egliseProvenance: "Église Saint-Pierre",
      dateRetour: "2024-01-29",
      estRenouvele: false
    },
    {
      id: 2,
      nom: "Dubois",
      prenom: "Marie",
      dateEmprunt: "2024-01-10",
      telephone: "06 98 76 54 32",
      email: "marie.dubois@email.com",
      titreOuvrage: "Introduction au Nouveau Testament",
      reference: "NT-045",
      dureeEmprunt: "2 semaines",
      nombreOuvrage: 2,
      egliseProvenance: "Église Saint-Paul",
      dateRetour: "2024-01-24",
      estRenouvele: true
    },
  ];

  const visiteursData: Visiteur[] = [
    {
      id: 1,
      nom: "Lefevre",
      prenom: "Thomas",
      adresse: "15 Rue de la Paix, 75002 Paris",
      egliseProvenance: "Église Saint-Germain",
      dateVisite: "2024-01-20"
    },
    {
      id: 2,
      nom: "Bernard",
      prenom: "Sophie",
      adresse: "22 Avenue des Champs-Élysées, 75008 Paris",
      egliseProvenance: "Église de la Madeleine",
      dateVisite: "2024-01-19"
    },
  ];

  const ventesData: Vente[] = [
    {
      id: 1,
      titre: "Catéchisme de l'Église Catholique",
      reference: "CAT-012",
      nom: "Petit",
      prenom: "Jean",
      adresse: "8 Rue de Rivoli, 75004 Paris",
      egliseProvenance: "Église Saint-Louis",
      prix: 25.50,
      dateVente: "2024-01-18"
    },
  ];

  const donsData: Don[] = [
    {
      id: 1,
      intitule: "Don pour l'achat de nouveaux livres",
      montant: 500.00,
      dateDon: "2024-01-15",
      donateur: "Association des Amis de la Bibliothèque"
    },
    {
      id: 2,
      intitule: "Don mensuel",
      montant: 100.00,
      dateDon: "2024-01-10",
      donateur: "M. et Mme Durand"
    },
  ];

  const achatsData: Achat[] = [
    {
      id: 1,
      intitule: "Nouveaux Testaments",
      montant: 300.00,
      dateAchat: "2024-01-05",
      fournisseur: "Éditions du Cerf",
      quantite: 20
    },
    {
      id: 2,
      intitule: "Études bibliques",
      montant: 450.00,
      dateAchat: "2024-01-03",
      fournisseur: "Bayard Presse",
      quantite: 15
    },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case 'emprunts':
        return (
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Emprunts en cours</h3>
            </div>
            <div className="table-scroll">
              <table className="library-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Date d'emprunt</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Titre de l'ouvrage</th>
                    <th>Référence</th>
                    <th>Durée</th>
                    <th>Nombre</th>
                    <th>Église</th>
                    <th>Date de retour</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {empruntsData.map((emprunt) => (
                    <tr key={emprunt.id}>
                      <td>{emprunt.nom}</td>
                      <td>{emprunt.prenom}</td>
                      <td>{emprunt.dateEmprunt}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Phone size={14} />
                          {emprunt.telephone}
                        </div>
                      </td>
                      <td>
                        {emprunt.email && (
                          <div className="flex items-center gap-1">
                            <Mail size={14} />
                            {emprunt.email}
                          </div>
                        )}
                      </td>
                      <td>{emprunt.titreOuvrage}</td>
                      <td>{emprunt.reference}</td>
                      <td>{emprunt.dureeEmprunt}</td>
                      <td>{emprunt.nombreOuvrage}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Church size={14} />
                          {emprunt.egliseProvenance}
                        </div>
                      </td>
                      <td>{emprunt.dateRetour}</td>
                      <td>
                        <span className={`status-badge ${emprunt.estRenouvele ? 'status-en-cours' : 'status-retourne'}`}>
                          {emprunt.estRenouvele ? 'Renouvelé' : 'En cours'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button btn-renew" title="Renouveler">
                            ↻
                          </button>
                          <button className="action-button btn-edit" title="Modifier">
                            Edit
                          </button>
                          <button className="action-button btn-delete" title="Supprimer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'visiteurs':
        return (
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Visiteurs</h3>
            </div>
            <div className="table-scroll">
              <table className="library-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Adresse</th>
                    <th>Église de provenance</th>
                    <th>Date de visite</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visiteursData.map((visiteur) => (
                    <tr key={visiteur.id}>
                      <td>{visiteur.nom}</td>
                      <td>{visiteur.prenom}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Home size={14} />
                          {visiteur.adresse}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Church size={14} />
                          {visiteur.egliseProvenance}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {visiteur.dateVisite}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button btn-edit" title="Modifier">
                            Edit
                          </button>
                          <button className="action-button btn-delete" title="Supprimer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'ventes':
        return (
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Ventes</h3>
            </div>
            <div className="table-scroll">
              <table className="library-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Référence</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Adresse</th>
                    <th>Église de provenance</th>
                    <th>Prix (€)</th>
                    <th>Date de vente</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ventesData.map((vente) => (
                    <tr key={vente.id}>
                      <td>{vente.titre}</td>
                      <td>{vente.reference}</td>
                      <td>{vente.nom}</td>
                      <td>{vente.prenom}</td>
                      <td>{vente.adresse}</td>
                      <td>{vente.egliseProvenance}</td>
                      <td>{vente.prix.toFixed(2)} €</td>
                      <td>{vente.dateVente}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button btn-edit" title="Modifier">
                            Edit
                          </button>
                          <button className="action-button btn-delete" title="Supprimer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'dons':
        return (
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Dons</h3>
            </div>
            <div className="table-scroll">
              <table className="library-table">
                <thead>
                  <tr>
                    <th>Intitulé</th>
                    <th>Montant (€)</th>
                    <th>Date du don</th>
                    <th>Donateur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donsData.map((don) => (
                    <tr key={don.id}>
                      <td>{don.intitule}</td>
                      <td>{don.montant.toFixed(2)} €</td>
                      <td>{don.dateDon}</td>
                      <td>{don.donateur}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button btn-edit" title="Modifier">
                            Edit
                          </button>
                          <button className="action-button btn-delete" title="Supprimer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'achats':
        return (
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Achats</h3>
            </div>
            <div className="table-scroll">
              <table className="library-table">
                <thead>
                  <tr>
                    <th>Intitulé</th>
                    <th>Montant (€)</th>
                    <th>Date d'achat</th>
                    <th>Fournisseur</th>
                    <th>Quantité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {achatsData.map((achat) => (
                    <tr key={achat.id}>
                      <td>{achat.intitule}</td>
                      <td>{achat.montant.toFixed(2)} €</td>
                      <td>{achat.dateAchat}</td>
                      <td>{achat.fournisseur}</td>
                      <td>{achat.quantite}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button btn-edit" title="Modifier">
                            Edit
                          </button>
                          <button className="action-button btn-delete" title="Supprimer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

 
  

  return (
    <div className="library-container">


      {/* Contenu principal */}
      <div className="main-content">
        {/* Navbar */}
        <nav className="library-navbar">
          <h1 className="nav-title">Bibliothèque</h1>
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'emprunts' ? 'active' : ''}`}
              onClick={() => setActiveTab('emprunts')}
            >
              <Book size={16} style={{ marginRight: '8px' }} />
              Emprunts
            </button>
            <button
              className={`nav-tab ${activeTab === 'visiteurs' ? 'active' : ''}`}
              onClick={() => setActiveTab('visiteurs')}
            >
              <Users size={16} style={{ marginRight: '8px' }} />
              Visiteurs
            </button>
            <button
              className={`nav-tab ${activeTab === 'ventes' ? 'active' : ''}`}
              onClick={() => setActiveTab('ventes')}
            >
              <ShoppingCart size={16} style={{ marginRight: '8px' }} />
              Ventes
            </button>
            <button
              className={`nav-tab ${activeTab === 'dons' ? 'active' : ''}`}
              onClick={() => setActiveTab('dons')}
            >
              <Gift size={16} style={{ marginRight: '8px' }} />
              Dons
            </button>
            <button
              className={`nav-tab ${activeTab === 'achats' ? 'active' : ''}`}
              onClick={() => setActiveTab('achats')}
            >
              <ShoppingCart size={16} style={{ marginRight: '8px' }} />
              Achats
            </button>
          </div>
        </nav>

        {/* Contenu des tableaux */}
        <div className="content-area">
          {renderTable()}
        </div>
      </div>
    </div>
  );
};

export default Library;