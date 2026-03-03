import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

interface JournalCaisseFormData {
  date: string;
  description: string;
  reference: string;
  entree: string;
  sortie: string;
  mode: string;
}

interface JournalCaisseFormProps {
  onSubmit: (data: JournalCaisseFormData) => void;
  onClose: () => void;
  initialData?: Partial<JournalCaisseFormData> | null;
}

type FormErrors = Partial<Record<keyof JournalCaisseFormData, string>>;

const JournalCaisseForm = ({ onSubmit, onClose, initialData = null }: JournalCaisseFormProps) => {
  const [formData, setFormData] = useState<JournalCaisseFormData>({
    date: initialData?.date ?? new Date().toLocaleDateString('fr-FR'),
    description: initialData?.description ?? '',
    reference: initialData?.reference ?? '',
    entree: initialData?.entree ?? '',
    sortie: initialData?.sortie ?? '',
    mode: initialData?.mode ?? 'Espece'
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.description) newErrors.description = 'La description est requise';
    if (!formData.reference) newErrors.reference = 'La reference est requise';
    if (!formData.entree && !formData.sortie) {
      newErrors.entree = 'Un montant est requis';
      newErrors.sortie = 'Un montant est requis';
    }
    if (formData.entree && formData.sortie) {
      newErrors.entree = 'Selectionnez entree OU sortie';
      newErrors.sortie = 'Selectionnez entree OU sortie';
    }
    if (formData.entree && Number(formData.entree) <= 0) newErrors.entree = 'Le montant doit etre positif';
    if (formData.sortie && Number(formData.sortie) <= 0) newErrors.sortie = 'Le montant doit etre positif';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof JournalCaisseFormData;
    setFormData((prev) => ({ ...prev, [key]: value }));

    if (key === 'entree' && value) setFormData((prev) => ({ ...prev, sortie: '' }));
    if (key === 'sortie' && value) setFormData((prev) => ({ ...prev, entree: '' }));
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
          <label className="accounting-form__label">Mode</label>
          <select name="mode" value={formData.mode} onChange={handleChange} className="accounting-form__select">
            <option value="Espece">Espece</option>
            <option value="Cheque">Cheque</option>
            <option value="Virement">Virement</option>
            <option value="Carte">Carte bancaire</option>
          </select>
        </div>
      </div>

      <div className="accounting-form__group">
        <label className="accounting-form__label">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description de l'operation"
          className={`accounting-form__input ${errors.description ? 'accounting-form__input--error' : ''}`}
        />
        {errors.description && <p className="accounting-form__error">{errors.description}</p>}
      </div>

      <div className="accounting-form__group">
        <label className="accounting-form__label">Reference</label>
        <input
          type="text"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          placeholder="N piece, cheque, etc."
          className={`accounting-form__input ${errors.reference ? 'accounting-form__input--error' : ''}`}
        />
        {errors.reference && <p className="accounting-form__error">{errors.reference}</p>}
      </div>

      <div className="accounting-form__grid">
        <div className="accounting-form__group">
          <label className="accounting-form__label">Entree</label>
          <div className="accounting-form__input-relative">
            <input
              type="number"
              name="entree"
              value={formData.entree}
              onChange={handleChange}
              placeholder="0"
              className={`accounting-form__input ${errors.entree ? 'accounting-form__input--error' : ''}`}
            />
            <span className="accounting-form__input-suffix">F</span>
          </div>
          {errors.entree && <p className="accounting-form__error">{errors.entree}</p>}
        </div>

        <div className="accounting-form__group">
          <label className="accounting-form__label">Sortie</label>
          <div className="accounting-form__input-relative">
            <input
              type="number"
              name="sortie"
              value={formData.sortie}
              onChange={handleChange}
              placeholder="0"
              className={`accounting-form__input ${errors.sortie ? 'accounting-form__input--error' : ''}`}
            />
            <span className="accounting-form__input-suffix">F</span>
          </div>
          {errors.sortie && <p className="accounting-form__error">{errors.sortie}</p>}
        </div>
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

export default JournalCaisseForm;
