import { useState } from 'react';
import AccountingCards from './AccountingCards';
import AccountingPanel from './AccountingPanel';
import type { AccountingModule } from './types';
import './css/styles.css';

const AccountingPage = () => {
  const [selectedModule, setSelectedModule] = useState<AccountingModule | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleCardClick = (module: AccountingModule) => {
    setSelectedModule(module);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedModule(null);
  };

  return (
    <div className="accounting-page">
      <div className="accounting-page__header">
        <h1 className="accounting-page__title">Comptabilite</h1>
      </div>
      <AccountingCards onCardClick={handleCardClick} />
      {panelOpen && selectedModule && <AccountingPanel module={selectedModule} onClose={handleClosePanel} />}
    </div>
  );
};

export default AccountingPage;
