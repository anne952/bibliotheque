import React from 'react';
import { Search, X } from 'lucide-react';
import './css/SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  size?: 'small' | 'default';
  align?: 'left' | 'right';
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher...',
  onClear,
  size = 'default',
  align = 'left',
}) => {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  const containerClass = `search-bar-container ${size === 'small' ? 'small' : ''} ${align === 'right' ? 'align-right' : ''}`;

  return (
    <div className={containerClass}>
      <div className={`search-input-wrapper ${size === 'small' ? 'small' : ''}`}>
        <Search size={size === 'small' ? 16 : 20} className="search-icon" />
        <input
          type="text"
          className={`search-input ${size === 'small' ? 'small' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Barre de recherche"
        />
        {value && (
          <button
            className="clear-button"
            onClick={handleClear}
            aria-label="Effacer la recherche"
            title="Effacer"
          >
            <X size={size === 'small' ? 14 : 18} />
          </button>
        )}
      </div>
      {value && (
        <div className={`search-results-info ${size === 'small' ? 'small' : ''}`}>
          Résultats pour: <strong>{value}</strong>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
