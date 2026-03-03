import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './css/SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-input-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder || "Rechercher..."}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <button type="submit" className="search-button">
        Rechercher
      </button>
    </form>
  );
};

export default SearchBar;