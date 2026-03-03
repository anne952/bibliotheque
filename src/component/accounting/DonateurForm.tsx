import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type DonateurType = 'Physique' | 'Moral';
type PaiementMode = 'Espece' | 'Cheque' | 'Virement' | 'Nature';

interface DonateurFormData {
  nom: string;
  type: DonateurType;
  montant: string;
  mode: PaiementMode;
  description: string;
  date: string;
}

interface DonateurFormProps {
  onSubmit: (data: DonateurFormData) => void;
  onClose: () => void;
  initialData?: Partial<DonateurFormData> | null;
}

type FormErrors = Partial<Record<keyof DonateurFormData, string>>;

const DonateurForm = ({ onSubmit, onClose, initialData = null }: DonateurFormProps) => {
  const [formData, setFormData] = useState<DonateurFormData>({
    nom: initialData?.nom ?? '',
    type: initialData?.type ?? 'Physique',
    montant: initialData?.montant ?? '',
    mode: initialData?.mode ?? 'Espece',
    description: initialData?.description ?? '',
    date: initialData?.date ?? new Date().toLocaleDateString('fr-FR')
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.montant || Number(formData.montant) <= 0) newErrors.montant = 'Le montant doit etre superieur a 0';
    if (!formData.description) newErrors.description = 'La description est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof DonateurFormData;
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="accounting-form">
      <div className="accounting-form__grid">
        <div className="accounting-form__group">
          <label className="accounting-form__label">Date</label>
          <input type="text" name="date" value={formData.date} onChange={handleChange} placeholder="JJ/MM/AAAA" className="accounting-form__input" />
        </div>
        <div className="accounting-form__group">
          <label className="accounting-form__label">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="accounting-form__select">
            <option value="Physique">Personne physique</option>
            <option value="Moral">Personne morale</option>
          </select>
        </div>
      </div>

      <div className="accounting-form__group">
        <label className="accounting-form__label">Nom complet</label>
        <input
          type="text"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          placeholder="Nom du donateur"
          className={`accounting-form__input ${errors.nom ? 'accounting-form__input--error' : ''}`}
        />
        {errors.nom && <p className="accounting-form__error">{errors.nom}</p>}
      </div>

      <div className="accounting-form__group">
        <label className="accounting-form__label">Montant</label>
        <div className="accounting-form__input-relative">
          <input
            type="number"
            name="montant"
            value={formData.montant}
            onChange={handleChange}
            placeholder="0"
            className={`accounting-form__input ${errors.montant ? 'accounting-form__input--error' : ''}`}
          />
          <span className="accounting-form__input-suffix">F</span>
        </div>
        {errors.montant && <p className="accounting-form__error">{errors.montant}</p>}
      </div>

      <div className="accounting-form__group">
        <label className="accounting-form__label">Mode de paiement</label>
        <select name="mode" value={formData.mode} onChange={handleChange} className="accounting-form__select">
          <option value="Espece">Espece</option>
          <option value="Cheque">Cheque</option>
          <option value="Virement">Virement</option>
          <option value="Nature">Nature (don materiel)</option>
        </select>
      </div>

      <div className="accounting-form__group">
        <label className="accounting-form__label">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Description du don..."
          className={`accounting-form__textarea ${errors.description ? 'accounting-form__input--error' : ''}`}
        />
        {errors.description && <p className="accounting-form__error">{errors.description}</p>}
      </div>

      <div className="accounting-form__actions">
        <button type="button" onClick={onClose} className="accounting-form__btn accounting-form__btn--cancel">
          Annuler
        </button>
        <button type="submit" className="accounting-form__btn accounting-form__btn--submit">
          {initialData ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default DonateurForm;
