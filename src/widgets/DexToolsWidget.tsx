import React from 'react';
import type { WidgetInstance } from '../types';

interface DexToolsWidgetProps {
  instance: WidgetInstance;
}

const DexToolsWidget: React.FC<DexToolsWidgetProps> = ({ instance }) => {
  // Try to get address from config, otherwise default to a known pair or base URL
  const address = instance.config?.address || instance.config?.symbol || 'Solana';
  const displayLabel = instance.config?.symbol ? `${instance.config.symbol} on DexTools` : 'Open DexTools';

  const handleClick = () => {
    // If we have a specific address, try to construct a pair URL, otherwise open main page
    // Note: Dextools URL structure: https://www.dextools.io/app/en/solana/pair-explorer/<address>
    const url = instance.config?.address
      ? `https://www.dextools.io/app/en/solana/pair-explorer/${instance.config.address}`
      : `https://www.dextools.io/app/en/solana/pair-explorer/DnF69cMec74U83t3629399X15949174158485`; // Default to a popular pair if none provided

    window.open(url, '_blank');
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 p-4 cursor-pointer hover:bg-gray-800 transition-colors" onClick={handleClick}>
      <img src="https://www.dextools.io/app/assets/img/logo/dextools_logo.png" alt="DexTools" className="h-12 mb-4" onError={(e) => e.currentTarget.style.display = 'none'} />
      <h3 className="text-xl font-bold text-white mb-2">{displayLabel}</h3>
      <p className="text-gray-400 text-sm text-center">Click to view charts and analysis on DexTools.io</p>
      <div className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
        Open in New Tab ↗
      </div>
    </div>
  );
};

export default DexToolsWidget;
