// Client: Search box component

import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about your organization's knowledge..."
          className="w-full p-5 pr-28 text-lg border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-surface"
          disabled={isLoading}
        />
        <Button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          isLoading={isLoading}
          disabled={!query.trim()}
        >
          Search
        </Button>
      </div>
    </form>
  );
};
