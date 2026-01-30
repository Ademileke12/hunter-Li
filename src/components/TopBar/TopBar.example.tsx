import React from 'react';
import { TopBar } from './TopBar';
import { I18nProvider } from '../../contexts/I18nContext';

/**
 * TopBar Component Examples
 * 
 * This file demonstrates various usage patterns for the TopBar component.
 */

// Example 1: Basic Usage
export function BasicTopBarExample() {
  return (
    <I18nProvider>
      <div className="h-screen bg-dark-bg">
        <TopBar />
        <div className="pt-20 px-6">
          <h2 className="text-2xl text-white">Basic TopBar</h2>
          <p className="text-gray-400 mt-2">
            TopBar with default configuration. Try the language toggle and wallet button!
          </p>
        </div>
      </div>
    </I18nProvider>
  );
}

// Example 2: With Token Selection Handler
export function TopBarWithTokenSelectionExample() {
  const handleTokenSelect = (tokenAddress: string) => {
    console.log('Token selected:', tokenAddress);
    alert(`Selected token: ${tokenAddress}\n\nThis would trigger the Fast Buy flow.`);
  };

  return (
    <I18nProvider>
      <div className="h-screen bg-dark-bg">
        <TopBar onTokenSelect={handleTokenSelect} />
        <div className="pt-20 px-6">
          <h2 className="text-2xl text-white">TopBar with Token Selection</h2>
          <p className="text-gray-400 mt-2">
            Search for a token (try "SOL" or "USDC") and select it to see the callback in action.
          </p>
        </div>
      </div>
    </I18nProvider>
  );
}

// Example 3: In a Full Application Layout
export function FullLayoutExample() {
  const [selectedToken, setSelectedToken] = React.useState<string | null>(null);

  const handleTokenSelect = (tokenAddress: string) => {
    setSelectedToken(tokenAddress);
  };

  return (
    <I18nProvider>
      <div className="h-screen bg-dark-bg flex flex-col">
        <TopBar onTokenSelect={handleTokenSelect} />
        
        {/* Main content area */}
        <div className="flex-1 pt-16 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Alpha Hunter Crypto Workspace
            </h1>
            
            {selectedToken ? (
              <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
                <h2 className="text-xl text-white mb-2">Selected Token</h2>
                <p className="text-gray-400 font-mono">{selectedToken}</p>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="mt-4 px-4 py-2 bg-accent-blue rounded-lg text-white hover:bg-accent-blue/80 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
                <p className="text-gray-400">
                  Use the search bar above to find and select a token.
                </p>
              </div>
            )}

            {/* Placeholder content to demonstrate scrolling */}
            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-dark-card rounded-lg p-6 border border-dark-border"
                >
                  <h3 className="text-lg text-white mb-2">Widget {i}</h3>
                  <p className="text-gray-400">
                    This is a placeholder widget. The TopBar remains fixed at the top as you scroll.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </I18nProvider>
  );
}

// Example 4: Testing Different States
export function TopBarStatesExample() {
  return (
    <I18nProvider>
      <div className="h-screen bg-dark-bg">
        <TopBar />
        <div className="pt-20 px-6 space-y-6">
          <div>
            <h2 className="text-2xl text-white mb-4">TopBar States</h2>
            <p className="text-gray-400">
              This example demonstrates the TopBar in various states:
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
              <h3 className="text-white font-medium mb-2">Language Toggle</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Click to open dropdown</li>
                <li>• Select a language to switch</li>
                <li>• Current language is highlighted</li>
                <li>• Preference is saved to localStorage</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
              <h3 className="text-white font-medium mb-2">Search Bar</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Type at least 3 characters to search</li>
                <li>• Results appear in dropdown</li>
                <li>• Click a result to select</li>
                <li>• Press Escape to close</li>
              </ul>
            </div>

            <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
              <h3 className="text-white font-medium mb-2">Wallet Button</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Click to see wallet options</li>
                <li>• Select a wallet to connect (mock)</li>
                <li>• When connected, shows address</li>
                <li>• Click address to disconnect</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </I18nProvider>
  );
}

// Example 5: Responsive Behavior
export function ResponsiveTopBarExample() {
  return (
    <I18nProvider>
      <div className="h-screen bg-dark-bg">
        <TopBar />
        <div className="pt-20 px-6">
          <h2 className="text-2xl text-white mb-4">Responsive TopBar</h2>
          <p className="text-gray-400 mb-4">
            Resize your browser window to see how the TopBar adapts:
          </p>
          
          <div className="space-y-4">
            <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
              <h3 className="text-white font-medium mb-2">Desktop (≥640px)</h3>
              <p className="text-gray-400 text-sm">
                Full layout with logo, title, subtitle, search, language toggle, and wallet button
              </p>
            </div>

            <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
              <h3 className="text-white font-medium mb-2">Mobile (&lt;640px)</h3>
              <p className="text-gray-400 text-sm">
                Compact layout with logo icon only, search bar adapts, controls remain accessible
              </p>
            </div>
          </div>
        </div>
      </div>
    </I18nProvider>
  );
}

// Default export for easy importing
export default {
  BasicTopBarExample,
  TopBarWithTokenSelectionExample,
  FullLayoutExample,
  TopBarStatesExample,
  ResponsiveTopBarExample,
};
