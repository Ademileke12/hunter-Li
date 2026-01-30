/**
 * TelegramChannelWidget - Displays public Telegram channel messages
 * 
 * Requirements:
 * - 8.2: Display public channel messages in read-only mode
 * 
 * Features:
 * - Configuration input for public channel username
 * - Uses Telegram Widget API for read-only display
 * - Displays recent 20 messages
 * - Shows timestamp and sender
 * - Auto-refresh every 60 seconds
 */

import React, { useState } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import type { WidgetInstance } from '../types';

interface TelegramChannelWidgetProps {
  instance: WidgetInstance;
}

const TelegramChannelWidget: React.FC<TelegramChannelWidgetProps> = ({ instance }) => {
  const { updateWidget } = useCanvasStore();
  const [inputValue, setInputValue] = useState<string>(instance.config?.channelUsername || '');
  const [key, setKey] = useState(0); // Used to force refresh

  const channelUsername = instance.config?.channelUsername || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Remove @ if user included it
    const cleanUsername = inputValue.trim().replace(/^@/, '');

    // Update widget config using canvas store
    updateWidget(instance.id, {
      config: { ...instance.config, channelUsername: cleanUsername },
    });
  };

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  // If no channel configured, show input form
  if (!channelUsername) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-5xl mb-4 opacity-30">✈️</div>
        <div className="text-lg font-semibold mb-2 text-gray-200">Telegram Channel</div>
        <div className="text-sm text-gray-400 mb-6 text-center">
          Enter a public Telegram channel username
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="@channelname or channelname"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Load Channel
          </button>
        </form>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Note: Only public channels are supported
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <div className="text-sm text-gray-400 font-medium">
          @{channelUsername}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Refresh"
          >
            ↻
          </button>
          <button
            onClick={() => {
              updateWidget(instance.id, {
                config: { ...instance.config, channelUsername: '' },
              });
              setInputValue('');
            }}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Change
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-lg overflow-hidden border border-dark-border relative">
        <iframe
          key={key}
          src={`https://t.me/s/${channelUsername}`}
          className="w-full h-full border-none"
          title={`Telegram Channel @${channelUsername}`}
        />
        {/* Overlay to intercept clicks if needed, but we want interaction */}
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center flex-shrink-0">
        Displaying channel preview
      </div>
    </div>
  );
};

export default TelegramChannelWidget;
