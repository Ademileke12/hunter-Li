/**
 * RSSFeedWidget - Displays RSS feed items
 * 
 * Requirements:
 * - 8.3: Display aggregated Solana news from RSS feeds
 * - 8.7: Display timestamps for all Alpha Feed items
 * 
 * Features:
 * - Configuration input for RSS feed URL
 * - Parse RSS XML using DOMParser
 * - Display: title, description, link, publish date
 * - Limit to 10 most recent items
 * - Implement click to open in new tab
 */

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import type { WidgetInstance } from '../types';

interface RSSFeedWidgetProps {
  instance: WidgetInstance;
}

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid?: string;
}

const RSSFeedWidget: React.FC<RSSFeedWidgetProps> = ({ instance }) => {
  const { updateWidget } = useCanvasStore();
  const [items, setItems] = useState<RSSItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(instance.config?.feedUrl || '');

  const feedUrl = instance.config?.feedUrl || '';
  const limit = instance.config?.limit || 10;
  const autoRefresh = instance.config?.autoRefresh ?? true;
  const refreshInterval = instance.config?.refreshInterval || 300000; // 5 minutes

  const fetchFeed = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use a CORS proxy to fetch the RSS feed
      // In production, you'd want to use your own backend proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch RSS feed');
      }

      const data = await response.json();
      const xmlText = data.contents;

      // Parse XML using DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Failed to parse RSS feed XML');
      }

      // Extract items from RSS feed
      const itemElements = xmlDoc.querySelectorAll('item');
      const parsedItems: RSSItem[] = [];

      itemElements.forEach((item, index) => {
        if (index >= limit) return; // Limit to specified number of items

        const title = item.querySelector('title')?.textContent || 'No title';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const guid = item.querySelector('guid')?.textContent || '';

        parsedItems.push({
          title,
          description,
          link,
          pubDate,
          guid,
        });
      });

      setItems(parsedItems);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RSS feed');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!feedUrl) {
      setItems([]);
      setError(null);
      return;
    }

    fetchFeed(feedUrl);

    // Auto-refresh if enabled
    if (autoRefresh) {
      const intervalId = setInterval(() => {
        fetchFeed(feedUrl);
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [feedUrl, limit, autoRefresh, refreshInterval]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Update widget config using canvas store
    updateWidget(instance.id, {
      config: { ...instance.config, feedUrl: inputValue.trim() },
    });
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return dateString;
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // If no feed URL configured, show input form
  if (!feedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-5xl mb-4 opacity-30">📡</div>
        <div className="text-lg font-semibold mb-2 text-gray-200">RSS Feed</div>
        <div className="text-sm text-gray-400 mb-6 text-center">
          Enter an RSS feed URL to display news and updates
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="https://example.com/rss.xml"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Load Feed
          </button>
        </form>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Example: https://solana.com/rss.xml
        </div>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-5xl mb-4 opacity-30">⚠️</div>
        <div className="text-lg font-semibold mb-2 text-gray-200">Failed to Load Feed</div>
        <div className="text-sm text-gray-400 mb-4 text-center">
          {error}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchFeed(feedUrl)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => {
              updateWidget(instance.id, {
                config: { ...instance.config, feedUrl: '' },
              });
              setInputValue('');
              setError(null);
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            Change Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-200">RSS Feed</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchFeed(feedUrl)}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50"
              title="Refresh feed"
            >
              {isLoading ? '⟳' : '↻'}
            </button>
            <button
              onClick={() => {
                updateWidget(instance.id, {
                  config: { ...instance.config, feedUrl: '' },
                });
                setInputValue('');
              }}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Change
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 truncate" title={feedUrl}>
          {feedUrl}
        </div>
      </div>

      {/* Feed Items */}
      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No items found in feed
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.guid || item.link || index}
                className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => {
                  if (item.link) {
                    window.open(item.link, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-200 line-clamp-2">
                    {item.title}
                  </h3>
                  {item.pubDate && (
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                      {formatDate(item.pubDate)}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-400 line-clamp-3">
                    {truncateText(stripHtml(item.description), 200)}
                  </p>
                )}
                {item.link && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                    <span>Read more</span>
                    <span>→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {autoRefresh && (
        <div className="flex-shrink-0 p-2 border-t border-gray-700 text-center">
          <div className="text-xs text-gray-500">
            Auto-refreshes every {Math.floor(refreshInterval / 60000)} minutes
          </div>
        </div>
      )}
    </div>
  );
};

export default RSSFeedWidget;
