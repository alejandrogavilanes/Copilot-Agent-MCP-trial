/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { searchLinks } from '../stores/link-lists';
import type { SearchResult } from '../utils/db';

interface SearchBarProps {
  listId: string;
  onResultsChange: (results: SearchResult[]) => void;
}

export default function SearchBar({ listId, onResultsChange }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        try {
          const results = await searchLinks(listId, query);
          onResultsChange(results);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        onResultsChange([]);
      }
    }, 300); // Debounce search for better performance

    return () => clearTimeout(searchTimer);
  }, [query, listId]);

  return (
    <div class="relative">
      <div class="flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setQuery(e.currentTarget.value)}
          placeholder="Search links..."
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 pl-10"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <svg class="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}