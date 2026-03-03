import JournalComptableForm from './JournalComptableForm';
import DonateurForm from './DonateurForm';
import JournalCaisseForm from './JournalCaisseForm';
import type { AccountingModule } from './types';

interface AccountingEntryFormProps {
  module: AccountingModule;
  onSubmit: (payload: unknown) => void;
  onClose: () => void;
  initialData?: Record<string, unknown> | null;
}

const AccountingEntryForm = ({ module, onSubmit, onClose, initialData = null }: AccountingEntryFormProps) => {
  const renderForm = () => {
    switch (module.id) {
      case 'journal':
        return <JournalComptableForm onSubmit={onSubmit} onClose={onClose} initialData={initialData} />;
      case 'donateurs':
        return <DonateurForm onSubmit={onSubmit} onClose={onClose} initialData={initialData} />;
      case 'caisse':
        return <JournalCaisseForm onSubmit={onSubmit} onClose={onClose} initialData={initialData} />;
      default:
        return <div className="accounting-empty">Formulaire non disponible pour ce module</div>;
    }
  };

  return (
    <div>
      <h3 className="accounting-modal__title">
        {initialData ? 'Modifier' : 'Ajouter'} - {module.title}
      </h3>
      {renderForm()}
    </div>
  );
};

export default AccountingEntryForm;
