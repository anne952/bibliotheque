import { FiBook, FiDollarSign, FiUsers, FiFileText, FiTrendingUp, FiList, FiLayers } from 'react-icons/fi';
import type { AccountingModule } from './types';
import './css/styles.css';

const cards: AccountingModule[] = [
  { id: 'journal', title: 'Journal comptable', icon: FiBook },
  { id: 'caisse', title: 'Journal de caisse', icon: FiDollarSign },
  { id: 'donateurs', title: 'Donateurs', icon: FiUsers },
  { id: 'bilan', title: 'Bilan', icon: FiFileText },
  { id: 'resultat', title: 'Compte resultat', icon: FiTrendingUp },
  { id: 'balance', title: 'Balance', icon: FiList },
  { id: 'grandlivre', title: 'Grand livre', icon: FiLayers }
];

interface AccountingCardsProps {
  onCardClick: (module: AccountingModule) => void;
}

const AccountingCards = ({ onCardClick }: AccountingCardsProps) => (
  <div className="accounting-cards">
    {cards.map((card) => {
      const Icon = card.icon;
      return (
        <div
          key={card.id}
          onClick={() => onCardClick(card)}
          className={`accounting-card accounting-card--${card.id}`}
        >
          <div className="accounting-card__icon">
            <Icon size={24} />
          </div>
          <div className="accounting-card__content">
            <h3 className="accounting-card__title">{card.title}</h3>
            <p className="accounting-card__subtitle">Cliquer pour ouvrir</p>
          </div>
        </div>
      );
    })}
  </div>
);

export default AccountingCards;
