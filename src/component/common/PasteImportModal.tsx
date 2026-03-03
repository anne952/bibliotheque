import { useMemo, useState } from 'react';
import './PasteImportModal.css';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface PasteImportModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  columns: string[];
  onClose: () => void;
  onImport: (raw: string) => Promise<ImportResult>;
}

const PasteImportModal = ({ isOpen, title, subtitle, columns, onClose, onImport }: PasteImportModalProps) => {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const disabled = useMemo(() => loading || raw.trim().length === 0, [loading, raw]);

  if (!isOpen) return null;

  const handleImport = async () => {
    try {
      setLoading(true);
      const nextResult = await onImport(raw);
      setResult(nextResult);
      if (nextResult.failed === 0) {
        setRaw('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paste-import-overlay" role="dialog" aria-modal="true">
      <div className="paste-import-modal">
        <div className="paste-import-modal__header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} className="paste-import-modal__close">x</button>
        </div>

        {subtitle && <p className="paste-import-modal__subtitle">{subtitle}</p>}

        <div className="paste-import-modal__columns">
          <strong>Colonnes attendues:</strong>
          <p>{columns.join(' | ')}</p>
        </div>

        <textarea
          className="paste-import-modal__textarea"
          placeholder="Copiez depuis Excel puis collez ici..."
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />

        {result && (
          <div className={`paste-import-modal__result ${result.failed > 0 ? 'paste-import-modal__result--error' : 'paste-import-modal__result--ok'}`}>
            <p>{result.success} ligne(s) importee(s), {result.failed} echec(s).</p>
            {result.errors.length > 0 && (
              <ul>
                {result.errors.slice(0, 5).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="paste-import-modal__actions">
          <button type="button" onClick={onClose} className="paste-import-modal__btn paste-import-modal__btn--cancel">
            Fermer
          </button>
          <button type="button" onClick={handleImport} disabled={disabled} className="paste-import-modal__btn paste-import-modal__btn--submit">
            {loading ? 'Import...' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasteImportModal;
