import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useCanvasStore } from '../../stores/canvasStore';
import { geckoTerminalClient } from '../../services/GeckoTerminalClient';

interface SearchResult {
  address: string;
  symbol: string;
  name: string;
}

interface SearchBarProps {
  onTokenSelect?: (tokenAddress: string) => void;
}

/**
 * SearchBar Component
 * Allows users to search for tokens by address or symbol
 * Displays search results and triggers Fast Buy flow on selection
 */
export function SearchBar({ onTokenSelect }: SearchBarProps) {
  const { t } = useTranslation();
  const fastBuyFlow = useCanvasStore((state) => state.fastBuyFlow);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        let pools: any[] = [];

        // Detect if query looks like a Solana address (base58, length 32-44)
        const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query);

        if (isAddress) {
          pools = await geckoTerminalClient.getPoolsByToken(query);
        } else {
          pools = await geckoTerminalClient.searchPools(query);
        }

        const mappedResults: SearchResult[] = pools
          .filter(pool => pool.attributes.name) // Ensure name exists
          .map(pool => {
            // GeckoTerminal returns base_token_id/quote_token_id in attributes usually, 
            // but for search/pools it might differ. The types defined in Client match standard pool objects.
            // We'll try to extract the "search target" (usually the base token).

            // Extract address from relationship ID 'solana_<address>'
            const baseTokenId = pool.relationships?.base_token?.data?.id;
            const address = baseTokenId ? baseTokenId.replace('solana_', '') : pool.attributes.address;

            return {
              address: address, // Token Address (or Pool address if token not found, but we prefer token)
              symbol: pool.attributes.name.split(' / ')[0], // Crude symbol extraction
              name: pool.attributes.name,
            };
          })
          // Deduplicate by address
          .filter((v, i, a) => a.findIndex(t => t.address === v.address) === i)
          .slice(0, 5); // Limit results

        setResults(mappedResults);
        setIsOpen(mappedResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Increased debounce for API

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);

    // Trigger Fast Buy flow with the selected token
    fastBuyFlow(result.address);

    // Also call the optional callback if provided
    onTokenSelect?.(result.address);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('topbar.search_placeholder')}
          className="w-full px-4 py-2 pl-10 pr-4 rounded-lg 
            bg-gray-100/50 dark:bg-dark-card/50 backdrop-blur-sm 
            border border-gray-200/50 dark:border-dark-border 
            text-gray-800 dark:text-gray-300 placeholder-gray-500 
            focus:outline-none focus:border-blue-500/50 dark:focus:border-accent-blue/50 
            focus:ring-1 focus:ring-blue-500/50 dark:focus:ring-accent-blue/50 
            transition-all duration-200"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg 
          bg-white/95 dark:bg-dark-card/95 backdrop-blur-md 
          border border-gray-200/50 dark:border-dark-border shadow-lg overflow-hidden z-50">
          {results.map((result) => (
            <button
              key={result.address}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left 
                hover:bg-gray-100/50 dark:hover:bg-dark-border/50 
                transition-colors duration-150 
                border-b border-gray-100 dark:border-dark-border last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{result.symbol}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{result.name}</div>
                </div>
                <div className="text-xs text-gray-500 font-mono truncate max-w-[120px]">
                  {result.address.slice(0, 4)}...{result.address.slice(-4)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
