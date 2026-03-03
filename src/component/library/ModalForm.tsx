import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type{ TabType } from '../../types/biblio';
import type{ FormField, FormPage } from '../../types/form';
import './css/ModalForm.css';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  type: TabType;
  initialData?: any;
  booksCatalog?: Array<{ id: string; titre: string; reference: string }>;
}

const ModalForm: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  initialData,
  booksCatalog = []
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [totalPages, setTotalPages] = useState(1);

  const normalize = (value: string) => value.trim().toLowerCase();
  const getExactBook = (title: string) => booksCatalog.find((book) => normalize(book.titre) === normalize(title));
  const isBookTitleField = (name: string) => (
    ['livre1_titre', 'livre2_titre', 'livre3_titre', 'titre'].includes(name)
  );
  const isMaterialBookField = () => type === 'dons-materiel' && String(formData.typeMateriel || '').toLowerCase() === 'livre';
  const getReferenceFieldForTitle = (name: string) => {
    if (name === 'livre1_titre') return 'livre1_reference';
    if (name === 'livre2_titre') return 'livre2_reference';
    if (name === 'livre3_titre') return 'livre3_reference';
    if (name === 'titre') return 'reference';
    return null;
  };

  useEffect(() => {
    if (initialData) {
      // If editing a vente that stores titres/references arrays, map to single titre/reference
      if (type === 'vente' && initialData.titres) {
        const mapped = { ...initialData };
        mapped.titre = initialData.titres[0] || initialData.titre || '';
        mapped.reference = initialData.references?.[0] || initialData.reference || '';
        setFormData(mapped);
      } else {
        setFormData(initialData);
      }
    } else {
      setFormData(getEmptyForm());
    }
    // Réinitialiser à la page 1 quand le modal s'ouvre
    setCurrentPage(1);
  }, [initialData, type]);

  // Configuration des pages pour chaque type
  const getFormPagesConfig = (): FormPage[] => {
    const configs = {
      emprunt: [
        {
          title: "Informations Personnelles",
          fields: [
            { name: 'nom', label: 'Nom *', type: 'text' as const, required: true },
            { name: 'prenom', label: 'Prénom *', type: 'text' as const, required: true },
            { name: 'telephone', label: 'Téléphone *', type: 'tel' as const, required: true },
            { name: 'email', label: 'Email', type: 'email' as const, required: false }
          ]
        },
        {
          title: "Livres Empruntés",
          fields: [
            { name: 'livre1_titre', label: 'Titre du livre 1 *', type: 'text' as const, required: true },
            { name: 'livre1_reference', label: 'Référence du livre 1 *', type: 'text' as const, required: true },
            { name: 'livre1_quantite', label: 'Quantité *', type: 'number' as const, required: true, min: 1 },
            { name: 'livre2_titre', label: 'Titre du livre 2', type: 'text' as const, required: false },
            { name: 'livre2_reference', label: 'Référence du livre 2', type: 'text' as const, required: false },
            { name: 'livre2_quantite', label: 'Quantité', type: 'number' as const, required: false, min: 1 },
            { name: 'livre3_titre', label: 'Titre du livre 3', type: 'text' as const, required: false },
            { name: 'livre3_reference', label: 'Référence du livre 3', type: 'text' as const, required: false },
            { name: 'livre3_quantite', label: 'Quantité', type: 'number' as const, required: false, min: 1 }
          ]
        },
        {
          title: "Dates et Durée",
          fields: [
            { name: 'dateEmprunt', label: 'Date d\'emprunt *', type: 'date' as const, required: true },
            { name: 'dureeEmprunt', label: 'Durée (jours) *', type: 'number' as const, required: true, defaultValue: 14 },
            { name: 'dateRetour', label: 'Date de retour *', type: 'date' as const, required: true },
            { name: 'renouvele', label: 'Déjà renouvelé', type: 'checkbox' as const, required: false },
            { name: 'egliseProvenance', label: 'Église de provenance *', type: 'text' as const, required: true }
          ]
        }
      ],
      visite: [
        {
          title: "Informations Personnelles",
          fields: [
            { name: 'nom', label: 'Nom *', type: 'text' as const, required: true },
            { name: 'prenom', label: 'Prénom *', type: 'text' as const, required: true },
            { name: 'adresse', label: 'Adresse *', type: 'text' as const, required: true },
            { name: 'egliseProvenance', label: 'Église de provenance *', type: 'text' as const, required: true }
          ]
        },
        {
          title: "Coordonnées",
          fields: [
            { name: 'telephone', label: 'Téléphone', type: 'tel' as const, required: false },
            { name: 'email', label: 'Email', type: 'email' as const, required: false },
            { name: 'dateVisite', label: 'Date de visite *', type: 'date' as const, required: true }
          ]
        }
      ],
      vente: [
        {
          title: "Informations du Livre",
          fields: [
            { name: 'titre', label: 'Titre  *', type: 'text' as const, required: true },
            { name: 'reference', label: 'Référence', type: 'text' as const, required: false },
            { name: 'montant', label: 'Montant (F) *', type: 'number' as const, required: true, min: 0, step: 0.01 },
            { name: 'dateVente', label: 'Date de vente *', type: 'date' as const, required: true }
          ]
        },
        {
          title: "Informations de l'Acheteur",
          fields: [
            { name: 'nom', label: 'Nom *', type: 'text' as const, required: true },
            { name: 'prenom', label: 'Prénom *', type: 'text' as const, required: true },
            { name: 'adresse', label: 'Adresse', type: 'text' as const, required: false }
          ]
        }
      ],
      'dons-financier': [
        {
          title: "Don Financier",
          fields: [
            { name: 'donateur', label: 'Nom du donateur *', type: 'text' as const, required: true },
            { name: 'type', label: 'Type de donateur *', type: 'select' as const, required: true,
              options: [
                { value: 'physique', label: 'Personne Physique' },
                { value: 'moral', label: 'Personne Morale' }
              ]
            },
            { name: 'montant', label: 'Montant (F) *', type: 'number' as const, required: true, min: 0, step: 0.01 },
            { name: 'mode', label: 'Mode de paiement *', type: 'select' as const, required: true,
              options: [
                { value: 'espece', label: 'Espèce' },
                { value: 'cheque', label: 'Chèque' },
                { value: 'virement', label: 'Virement' },
                { value: 'nature', label: 'Nature' }
              ]
            },
            { name: 'dateDon', label: 'Date du don *', type: 'date' as const, required: true },
            { name: 'description', label: 'Description (optionnel)', type: 'text' as const, required: false }
          ]
        }
      ],
      'dons-materiel': [
        {
          title: "Matériel à Donner",
          fields: [
            { name: 'typeMateriel', label: 'Type de matériel *', type: 'select' as const, required: true,
              options: [
                { value: 'livre', label: 'Livre' },
                { value: 'carte-sd', label: 'Carte SD' },
                { value: 'tablette', label: 'Tablette' },
                { value: 'autre', label: 'Autre matériel' }
              ]
            },
            { name: 'materiel', label: 'Nom/Titre du matériel *', type: 'text' as const, required: true },
            { name: 'quantite', label: 'Quantité *', type: 'number' as const, required: true, min: 1 }
          ]
        },
        {
          title: "Institution Destinataire",
          fields: [
            { name: 'institutionDestinaire', label: 'Institution destinataire *', type: 'text' as const, required: true },
            { name: 'dateDon', label: 'Date du don *', type: 'date' as const, required: true },
            { name: 'description', label: 'Description (optionnel)', type: 'text' as const, required: false }
          ]
        }
      ],
      achat: [
        {
          title: "Informations de l'Achat",
          fields: [
            { name: 'intitule', label: 'Intitulé *', type: 'text' as const, required: true },
            { name: 'montant', label: 'Montant (F) *', type: 'number' as const, required: true, min: 0, step: 0.01 },
            { name: 'dateAchat', label: 'Date *', type: 'date' as const, required: true },
            { name: 'fournisseur', label: 'Fournisseur', type: 'text' as const, required: false }
          ]
        }
      ]
    };

    return configs[type] || [];
  };

  const getEmptyForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultValues = {
      emprunt: {
        nom: '',
        prenom: '',
        dateEmprunt: today,
        telephone: '',
        email: '',
        livre1_titre: '',
        livre1_reference: '',
        livre1_quantite: 1,
        livre2_titre: '',
        livre2_reference: '',
        livre2_quantite: 1,
        livre3_titre: '',
        livre3_reference: '',
        livre3_quantite: 1,
        dureeEmprunt: 14,
        egliseProvenance: '',
        dateRetour: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        renouvele: false
      },
      visite: {
        nom: '',
        prenom: '',
        adresse: '',
        egliseProvenance: '',
        telephone: '',
        email: '',
        dateVisite: today
      },
      vente: {
        titre: '',
        reference: '',
        nom: '',
        prenom: '',
        adresse: '',
        montant: 0,
        dateVente: today
      },
      'dons-financier': {
        donateur: '',
        type: 'physique',
        montant: 0,
        mode: 'espece',
        dateDon: today,
        description: ''
      },
      'dons-materiel': {
        typeMateriel: 'livre',
        materiel: '',
        quantite: 1,
        institutionDestinaire: '',
        dateDon: today,
        description: ''
      },
      achat: {
        intitule: '',
        montant: 0,
        dateAchat: today,
        fournisseur: ''
      }
    };

    return defaultValues[type] || {};
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    setFormData((prev: any) => {
      const next = {
        ...prev,
        [name]: inputType === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : inputType === 'number'
            ? parseFloat(value) || 0
            : value
      };

      if (isBookTitleField(name) || (name === 'materiel' && isMaterialBookField())) {
        const exact = getExactBook(String(value || ''));
        const refField = getReferenceFieldForTitle(name);
        if (exact && refField) {
          next[name] = exact.titre;
          next[refField] = exact.reference || '';
        }
      }

      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation finale
    if (validateCurrentPage()) {
      onSubmit(formData);
      onClose();
    }
  };

  const validateCurrentPage = () => {
    const currentPageConfig = getFormPagesConfig()[currentPage - 1];
    const requiredFields = currentPageConfig.fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      const value = formData[field.name];
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '') ||
          (typeof value === 'number' && value <= 0 && field.name !== 'montant')) {
        alert(`Le champ "${field.label}" est obligatoire.`);
        return false;
      }
    }

    if (type === 'emprunt' || type === 'vente') {
      const titleFields = type === 'emprunt'
        ? ['livre1_titre', 'livre2_titre', 'livre3_titre']
        : ['titre'];

      for (const fieldName of titleFields) {
        const title = String(formData[fieldName] || '').trim();
        if (!title) continue;
        if (!getExactBook(title)) {
          alert(`Le livre "${title}" n'existe pas dans la liste.`);
          return false;
        }
      }
    }

    if (type === 'dons-materiel' && String(formData.typeMateriel || '').toLowerCase() === 'livre') {
      const title = String(formData.materiel || '').trim();
      if (!title || !getExactBook(title)) {
        alert('Le livre donne doit exister dans la liste des livres.');
        return false;
      }
    }

    return true;
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (validateCurrentPage()) {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getPageTitle = () => {
    const pages = getFormPagesConfig();
    if (pages.length === 0) return '';
    
    if (pages.length === 1) {
      return `${initialData ? 'Modifier' : 'Ajouter'} ${type === 'emprunt' ? 'un emprunt' : 
              type === 'visite' ? 'un visiteur' : 
              type === 'vente' ? 'une vente' : 
              type === 'dons-financier' ? 'un don financier' :
              type === 'dons-materiel' ? 'un don de matériel' :
              type === 'achat' ? 'un achat' : 'un don'}`;
    }
    
    return pages[currentPage - 1]?.title || '';
  };

  const renderFormFields = () => {
    const pages = getFormPagesConfig();
    if (pages.length === 0) return null;
    
    const currentPageConfig = pages[currentPage - 1];
    if (!currentPageConfig) return null;

    return currentPageConfig.fields.map((field: FormField, index: number) => {
      const isNumberField = field.type === 'number';
      const isCheckboxField = field.type === 'checkbox';
      const isSelectField = field.type === 'select';
      
      return (
        <div key={index} className="form-group">
          <label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="required-star">*</span>}
          </label>
          
          {isCheckboxField ? (
            <div className="checkbox-group">
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={formData[field.name] || false}
                onChange={handleChange}
                className="checkbox-input"
              />
              <label htmlFor={field.name} className="checkbox-label">
                {field.label.replace('*', '')}
              </label>
            </div>
          ) : isSelectField ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              className="form-input"
            >
              <option value="">Sélectionnez...</option>
              {(field as any).options?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name] || (isNumberField ? 0 : '')}
              onChange={handleChange}
              list={isBookTitleField(field.name) || (field.name === 'materiel' && isMaterialBookField()) ? `books-list-${type}` : undefined}
              required={field.required}
              min={isNumberField ? (field as any).min : undefined}
              step={isNumberField ? (field as any).step : undefined}
              className="form-input"
              placeholder={`Entrez ${field.label.toLowerCase().replace('*', '')}`}
            />
          )}
          
          {field.name === 'dateRetour' && formData.dateEmprunt && formData.dureeEmprunt && (
            <small className="field-hint">
              Calculé automatiquement à partir de la date d'emprunt et de la durée
            </small>
          )}
        </div>
      );
    });
  };

  const renderPaginationDots = () => {
    const pages = getFormPagesConfig();
    if (pages.length <= 1) return null;

    return (
      <div className="pagination-dots">
        {pages.map((_, index) => (
          <div
            key={index}
            className={`pagination-dot ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(index + 1)}
          />
        ))}
      </div>
    );
  };

  // Calculer le nombre total de pages
  const pagesConfig = getFormPagesConfig();
  const calculatedTotalPages = pagesConfig.length;

  // Mettre à jour totalPages quand type change
  useEffect(() => {
    setTotalPages(calculatedTotalPages);
  }, [type, calculatedTotalPages]);

  if (!isOpen) return null;

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-top">
            <h2 className="modal-title">
              {getPageTitle()}
            </h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          
          {totalPages > 1 && (
            <div className="form-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
              <div className="progress-text">
                Étape {currentPage} sur {totalPages}
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <datalist id={`books-list-${type}`}>
              {booksCatalog.map((book) => (
                <option key={book.id || `${book.titre}-${book.reference}`} value={book.titre}>
                  {book.reference}
                </option>
              ))}
            </datalist>
            <div className="form-fields">
              {renderFormFields()}
            </div>
            
            {renderPaginationDots()}
          </div>
          
          <div className="modal-footer">
            <div className="footer-left">
              {!isFirstPage && (
                <button 
                  type="button" 
                  className="modal-btn secondary-btn"
                  onClick={handlePrev}
                >
                  <ChevronLeft size={18} />
                  <span>Précédent</span>
                </button>
              )}
            </div>
            
            <div className="footer-right">
              {!isLastPage ? (
                <button 
                  type="button" 
                  className="modal-btn primary-btn"
                  onClick={handleNext}
                >
                  <span>Suivant</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="modal-btn success-btn"
                >
                  {initialData ? 'Modifier' : 'Enregistrer'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalForm;
