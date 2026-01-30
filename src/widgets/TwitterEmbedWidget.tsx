/**
 * TwitterEmbedWidget - Displays embedded tweets
 * 
 * Requirements:
 * - 8.1: Display embedded tweets using Twitter embed API
 * 
 * Features:
 * - Configuration input for username or tweet URL
 * - Uses Twitter oEmbed API: https://publish.twitter.com/oembed
 * - Displays embedded tweet in iframe
 * - Handles embed failures gracefully
 */

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import type { WidgetInstance } from '../types';

interface TwitterEmbedWidgetProps {
  instance: WidgetInstance;
}

interface TwitterEmbedResponse {
  html: string;
  url: string;
  author_name: string;
  author_url: string;
  width: number;
  height: number | null;
}

const TwitterEmbedWidget: React.FC<TwitterEmbedWidgetProps> = ({ instance }) => {
  const { updateWidget } = useCanvasStore();
  const [embedHtml, setEmbedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(instance.config?.tweetUrl || '');

  const tweetUrl = instance.config?.tweetUrl || '';

  useEffect(() => {
    if (!tweetUrl) {
      setEmbedHtml('');
      setError(null);
      return;
    }

    const fetchEmbed = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use Twitter oEmbed API
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch tweet embed');
        }

        const data: TwitterEmbedResponse = await response.json();
        setEmbedHtml(data.html);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tweet');
        setIsLoading(false);
      }
    };

    fetchEmbed();
  }, [tweetUrl]);

  // Load Twitter widgets script when embed HTML is available
  useEffect(() => {
    if (embedHtml) {
      // Load Twitter widgets script if not already loaded
      if (!(window as any).twttr) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
      } else {
        // Reload widgets if script already exists
        (window as any).twttr?.widgets?.load();
      }
    }
  }, [embedHtml]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let processedUrl = inputValue.trim();

    // If it's a username (starts with @), convert to a profile URL
    // Note: Twitter oEmbed API doesn't support profile embeds, only tweets
    // So we'll store the username but show a message
    if (processedUrl.startsWith('@')) {
      // Remove @ and store as username
      const username = processedUrl.substring(1);
      updateWidget(instance.id, {
        config: { ...instance.config, tweetUrl: `https://twitter.com/${username}`, isUsername: true },
      });
      return;
    }

    // If it's not a full URL, assume it's a tweet ID or username
    if (!processedUrl.startsWith('http')) {
      // Check if it looks like a username (no numbers, no slashes)
      if (!/\d/.test(processedUrl) && !processedUrl.includes('/')) {
        processedUrl = `https://twitter.com/${processedUrl}`;
        updateWidget(instance.id, {
          config: { ...instance.config, tweetUrl: processedUrl, isUsername: true },
        });
        return;
      }
    }

    // Update widget config using canvas store
    updateWidget(instance.id, {
      config: { ...instance.config, tweetUrl: processedUrl, isUsername: false },
    });
  };

  // If no tweet URL configured, show input form
  if (!tweetUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-5xl mb-4 opacity-30">🐦</div>
        <div className="text-lg font-semibold mb-2 text-gray-200">Twitter Embed</div>
        <div className="text-sm text-gray-400 mb-6 text-center">
          Enter a Twitter username or tweet URL
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="@username or tweet URL"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Load Tweet
          </button>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading tweet...</div>
      </div>
    );
  }

  if (error) {
    const isUsername = instance.config?.isUsername;
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-5xl mb-4 opacity-30">⚠️</div>
        <div className="text-lg font-semibold mb-2 text-gray-200">
          {isUsername ? 'Username Embed Not Supported' : 'Failed to Load Tweet'}
        </div>
        <div className="text-sm text-gray-400 mb-4 text-center">
          {isUsername 
            ? 'Twitter oEmbed API only supports individual tweet URLs, not user profiles. Please provide a specific tweet URL.'
            : error
          }
        </div>
        <button
          onClick={() => {
            updateWidget(instance.id, {
              config: { ...instance.config, tweetUrl: '' },
            });
            setInputValue('');
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
        >
          Try Another Tweet
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div
        className="twitter-embed-container"
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />
    </div>
  );
};

export default TwitterEmbedWidget;
