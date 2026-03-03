import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import nCompteRaw from './nCompte?raw';

interface JournalComptableFormData {
  date: string;
  compte: string;
  libelle: string;
  debit: string;
  credit: string;
  piece: string;
  journal: string;
}

interface JournalComptableFormProps {
  onSubmit: (data: JournalComptableFormData) => void;
  onClose: () => void;
  initialData?: Partial<JournalComptableFormData> | null;
}

type FormErrors = Partial<Record<keyof JournalComptableFormData, string>>;

const JournalComptableForm = ({ onSubmit, onClose, initialData = null }: JournalComptableFormProps) => {
  const [formData, setFormData] = useState<JournalComptableFormData>({
    date: initialData?.date ?? new Date().toLocaleDateString('fr-FR'),
    compte: initialData?.compte ?? '',
    libelle: initialData?.libelle ?? '',
    debit: initialData?.debit ?? '',
    credit: initialData?.credit ?? '',
    piece: initialData?.piece ?? '',
    journal: initialData?.journal ?? 'ACH'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
  const accountSearchBtnRef = useRef<HTMLButtonElement | null>(null);

  const accountOptions = useMemo(() => {
    const byCode = new Map<string, string>();

    nCompteRaw.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.replace(/\*\*/g, '').trim();
      const match = line.match(/^-?\s*(\d{2,6})\s*-?\s*(.*)$/);

      if (!match) {
        return;
      }

      const code = match[1];
      const label = match[2].trim();
      const current = byCode.get(code);

      if (!current || (!current.length && label.length)) {
        byCode.set(code, label);
      }
    });

    return Array.from(byCode.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => Number(a.code) - Number(b.code));
  }, []);

  const filteredAccountOptions = useMemo(() => {
    const term = accountSearchTerm.trim().toLowerCase();

    if (!term) {
      return accountOptions;
    }

    return accountOptions.filter(
      ({ code, label }) => code.includes(term) || label.toLowerCase().includes(term)
    );
  }, [accountOptions, accountSearchTerm]);

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.compte) newErrors.compte = 'Le numero de compte est requis';
    else if (!/^\d{2,6}$/.test(formData.compte)) newErrors.compte = 'Format invalide (ex: 57, 601, 7011)';
    if (!formData.libelle) newErrors.libelle = 'Le libelle est requis';
    if (!formData.debit && !formData.credit) {
      newErrors.debit = 'Un montant est requis';
      newErrors.credit = 'Un montant est requis';
    }
    if (formData.debit && formData.credit) {
      newErrors.debit = 'Selectionnez debit OU credit';
      newErrors.credit = 'Selectionnez debit OU credit';
    }
    if (formData.debit && Number(formData.debit) <= 0) newErrors.debit = 'Le montant doit etre positif';
    if (formData.credit && Number(formData.credit) <= 0) newErrors.credit = 'Le montant doit etre positif';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof JournalComptableFormData;
    setFormData((prev) => ({ ...prev, [key]: value }));
    
    // Si on rentre un debit, vider le credit et vice versa
    if (key === 'debit' && value) setFormData((prev) => ({ ...prev, credit: '' }));
    if (key === 'credit' && value) setFormData((prev) => ({ ...prev, debit: '' }));
    
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleToggleAccountPicker = () => {
    if (showAccountPicker) {
      setShowAccountPicker(false);
      return;
    }

    if (window.innerWidth <= 768 || !accountSearchBtnRef.current) {
      setPickerPosition(null);
      setShowAccountPicker(true);
      return;
    }

    const rect = accountSearchBtnRef.current.getBoundingClientRect();
    const pickerWidth = Math.min(440, window.innerWidth * 0.92);
    const pickerHeight = 420;
    let left = rect.right + 12;
    let top = rect.top;

    if (left + pickerWidth > window.innerWidth - 12) {
      left = Math.max(12, rect.left - pickerWidth - 12);
    }

    if (top + pickerHeight > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - pickerHeight - 12);
    }

    setPickerPosition({ top, left });
    setShowAccountPicker(true);
  };

  return (
    <form onSubmit={handleSubmit} className="accounting-form">
      <div className="accounting-form__grid">
        <div className="accounting-form__group">
          <label className="accounting-form__label">Date</label>
          <input type="text" name="date" value={formData.date} onChange={handleChange} placeholder="JJ/MM/AAAA" className="accounting-form__input" />
        </div>

        <div className="accounting-form__group">
          <label className="accounting-form__label">Piece</label>
          <input type="text" name="piece" value={formData.piece} onChange={handleChange} placeholder="F001, V002, etc." className="accounting-form__input" />
        </div>

        <div className="accounting-form__group">
          <label className="accounting-form__label">N Compte</label>
          <button
            type="button"
            ref={accountSearchBtnRef}
            onClick={handleToggleAccountPicker}
            className="accounting-form__account-search-btn"
          >
            Rechercher un compte
          </button>
          <input
            type="text"
            name="compte"
            value={formData.compte}
            onChange={handleChange}
            placeholder="601, 701, etc."
            className={`accounting-form__input ${errors.compte ? 'accounting-form__input--error' : ''}`}
          />

          {showAccountPicker && (
            <div
              className="accounting-form__account-picker"
              role="dialog"
              aria-label="Liste des comptes"
              style={pickerPosition ? { position: 'fixed', top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px` } : undefined}
            >
              <div className="accounting-form__account-picker-header">
                <input
                  type="search"
                  value={accountSearchTerm}
                  onChange={(e) => setAccountSearchTerm(e.target.value)}
                  placeholder="Filtrer par numero ou libelle"
                  className="accounting-form__input"
                />
                <button
                  type="button"
                  onClick={() => setShowAccountPicker(false)}
                  className="accounting-form__account-picker-close"
                >
                  Fermer
                </button>
              </div>

              <div className="accounting-form__account-picker-list">
                {filteredAccountOptions.length > 0 ? (
                  filteredAccountOptions.map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      className="accounting-form__account-picker-item"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, compte: code }));
                        if (errors.compte) {
                          setErrors((prev) => ({ ...prev, compte: undefined }));
                        }
                        setShowAccountPicker(false);
                      }}
                    >
                      <span className="accounting-form__account-picker-code">{code}</span>
                      <span className="accounting-form__account-picker-label">{label || '-'}</span>
                    </button>
                  ))
                ) : (
                  <p className="accounting-form__account-picker-empty">Aucun compte trouve</p>
                )}
              </div>
            </div>
          )}
          {errors.compte && <p className="accounting-form__error">{errors.compte}</p>}
        </div>

        <div className="accounting-form__group">
          <label className="accounting-form__label">Journal</label>
          <select name="journal" value={formData.journal} onChange={handleChange} className="accounting-form__select">
            <option value="ACH">ACH - Achats</option>
            <option value="VTE">VTE - Ventes</option>
            <option value="CAI">CAI - Caisse</option>
            <option value="BAN">BAN - Banque</option>
            <option value="OD">OD - Operations diverses</option>
          </select>
        </div>
      </div>

      <div className="accounting-form__group">
        <label className="accounting-form__label">Libelle</label>
        <input
          type="text"
          name="libelle"
          value={formData.libelle}
          onChange={handleChange}
          placeholder="Description de l'ecriture"
          className={`accounting-form__input ${errors.libelle ? 'accounting-form__input--error' : ''}`}
        />
        {errors.libelle && <p className="accounting-form__error">{errors.libelle}</p>}
      </div>

      <div className="accounting-form__grid">
        <div className="accounting-form__group">
          <label className="accounting-form__label">Debit</label>
          <div className="accounting-form__input-relative">
            <input
              type="number"
              name="debit"
              value={formData.debit}
              onChange={handleChange}
              placeholder="0"
              className={`accounting-form__input ${errors.debit ? 'accounting-form__input--error' : ''}`}
            />
            <span className="accounting-form__input-suffix">F</span>
          </div>
          {errors.debit && <p className="accounting-form__error">{errors.debit}</p>}
        </div>
        <div className="accounting-form__group">
          <label className="accounting-form__label">Credit</label>
          <div className="accounting-form__input-relative">
            <input
              type="number"
              name="credit"
              value={formData.credit}
              onChange={handleChange}
              placeholder="0"
              className={`accounting-form__input ${errors.credit ? 'accounting-form__input--error' : ''}`}
            />
            <span className="accounting-form__input-suffix">F</span>
          </div>
          {errors.credit && <p className="accounting-form__error">{errors.credit}</p>}
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

export default JournalComptableForm;
