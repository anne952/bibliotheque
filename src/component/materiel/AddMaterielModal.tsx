import React, { useState } from 'react';
import type{ 
  Materiel, 
  TypeMateriel, 
  EtatMateriel, 
  LangueLivre, 
  CategorieLivre, 
  CategorieCarteSD,
  Livre,
  CarteSD,
  Tablette,
  AutreMateriel
} from '../../types/materiel';

interface AddMaterielModalProps {
  onClose: () => void;
  onAdd: (materiel: Materiel) => void;
}

const AddMaterielModal: React.FC<AddMaterielModalProps> = ({ onClose, onAdd }) => {
  const [type, setType] = useState<TypeMateriel>('livre');
  const [etat, setEtat] = useState<EtatMateriel>('fonctionnel');

  // États spécifiques aux livres
  const [titre, setTitre] = useState('');
  const [reference, setReference] = useState('');
  const [volume, setVolume] = useState<number | undefined>();
  const [langue, setLangue] = useState<LangueLivre>('Français');
  const [categorieLivre, setCategorieLivre] = useState<CategorieLivre>('livre');

  // États spécifiques aux cartes SD
  const [categorieCarteSD, setCategorieCarteSD] = useState<CategorieCarteSD>('basique');

  // États spécifiques aux tablettes
  const [numeroSerie, setNumeroSerie] = useState('');
  const [nomTablette, setNomTablette] = useState('Tablette Agapao');

  // États pour photocopieuse et autre matériel
  const [nomMateriel, setNomMateriel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nouveauMateriel: any = {
      id: '',
      type,
      etat,
      dateAjout: new Date().toISOString().split('T')[0],
      stockOperations: []
    };

    // Ajouter les propriétés spécifiques selon le type
    switch (type) {
      case 'livre':
        nouveauMateriel.titre = titre;
        nouveauMateriel.reference = reference;
        nouveauMateriel.volume = volume;
        nouveauMateriel.langue = langue;
        nouveauMateriel.categorie = categorieLivre;
        break;
      case 'carte-sd':
        nouveauMateriel.categorie = categorieCarteSD;
        break;
      case 'tablette':
        nouveauMateriel.numeroSerie = numeroSerie;
        nouveauMateriel.nom = nomTablette;
        break;
      case 'photocopieuse':
        nouveauMateriel.nom = nomMateriel;
        break;
      case 'autre':
        nouveauMateriel.nom = nomMateriel;
        break;
    }

    onAdd(nouveauMateriel);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Ajouter un Nouveau Matériel</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type de Matériel *</label>
            <select value={type} onChange={(e) => setType(e.target.value as TypeMateriel)} required>
              <option value="livre">Livre</option>
              <option value="carte-sd">Carte SD</option>
              <option value="tablette">Tablette</option>
              <option value="photocopieuse">Photocopieuse</option>
              <option value="autre">Autre</option>
            </select>
          </div>



          <div className="form-group">
            <label>État *</label>
            <select value={etat} onChange={(e) => setEtat(e.target.value as EtatMateriel)} required>
              <option value="fonctionnel">Fonctionnel</option>
              <option value="défectueux">Défectueux</option>
              <option value="en réparation">En réparation</option>
              <option value="inutilisable">Inutilisable</option>
            </select>
          </div>

          {/* Champs spécifiques selon le type */}
          {type === 'livre' && (
            <div className="form-section">
              <h3>Détails du Livre</h3>
              <div className="form-group">
                <label>Titre *</label>
                <input 
                  type="text" 
                  value={titre} 
                  onChange={(e) => setTitre(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Référence *</label>
                  <input 
                    type="text" 
                    value={reference} 
                    onChange={(e) => setReference(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Volume</label>
                  <input 
                    type="number" 
                    value={volume || ''} 
                    onChange={(e) => setVolume(e.target.value ? parseInt(e.target.value) : undefined)} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Langue</label>
                  <select value={langue} onChange={(e) => setLangue(e.target.value as LangueLivre)}>
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Ewé">Ewé</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select value={categorieLivre} onChange={(e) => setCategorieLivre(e.target.value as CategorieLivre)}>
                    <option value="livre">Livre</option>
                    <option value="brochure">Brochure</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {type === 'carte-sd' && (
            <div className="form-section">
              <h3>Détails de la Carte SD</h3>
              <div className="form-group">
                <label>Catégorie</label>
                <select value={categorieCarteSD} onChange={(e) => setCategorieCarteSD(e.target.value as CategorieCarteSD)}>
                  <option value="basique">Basique</option>
                  <option value="android">Android</option>
                </select>
              </div>
            </div>
          )}

          {type === 'tablette' && (
            <div className="form-section">
              <h3>Détails de la Tablette</h3>
              <div className="form-group">
                <label>Nom</label>
                <input 
                  type="text" 
                  value={nomTablette} 
                  onChange={(e) => setNomTablette(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Numéro de série</label>
                <input 
                  type="text" 
                  value={numeroSerie} 
                  onChange={(e) => setNumeroSerie(e.target.value)} 
                />
              </div>
            </div>
          )}

          {type === 'photocopieuse' && (
            <div className="form-section">
              <h3>Détails de la Photocopieuse</h3>
              <div className="form-group">
                <label>Nom *</label>
                <input 
                  type="text" 
                  value={nomMateriel} 
                  onChange={(e) => setNomMateriel(e.target.value)} 
                  required 
                />
              </div>
            </div>
          )}

          {type === 'autre' && (
            <div className="form-section">
              <h3>Détails du Matériel</h3>
              <div className="form-group">
                <label>Nom *</label>
                <input 
                  type="text" 
                  value={nomMateriel} 
                  onChange={(e) => setNomMateriel(e.target.value)} 
                  required 
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-submit">
              Ajouter le Matériel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterielModal;
