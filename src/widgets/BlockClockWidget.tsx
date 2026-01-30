/**
 * BlockClockWidget - Displays real-time Solana blockchain slot information
 * 
 * Requirements:
 * - 9.3: Display current Solana slot and estimated time
 * - 9.6: Update in real-time using Public_RPC
 */

import React, { useState, useEffect } from 'react';
import solanaClient from '../services/SolanaClient';
import type { WidgetInstance } from '../types';

interface BlockClockWidgetProps {
  instance: WidgetInstance;
}

const BlockClockWidget: React.FC<BlockClockWidgetProps> = ({ instance }) => {
  const [slot, setSlot] = useState<number>(0);
  const [epoch, setEpoch] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const updateSlot = async () => {
      try {
        const currentSlot = await solanaClient.getCurrentSlot();
        
        if (mounted) {
          setSlot(currentSlot);
          setLoading(false);
          setError(null);
          
          // Get epoch info
          const connection = solanaClient.getConnection();
          const epochInfo = await connection.getEpochInfo();
          setEpoch(epochInfo.epoch);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch slot');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    updateSlot();

    // Update every 400ms (Solana block time)
    intervalId = setInterval(updateSlot, 400);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Calculate estimated time from slot (400ms per slot)
  const estimatedTime = slot * 400;
  const estimatedSeconds = Math.floor(estimatedTime / 1000);
  const estimatedMinutes = Math.floor(estimatedSeconds / 60);
  const estimatedHours = Math.floor(estimatedMinutes / 60);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-400 text-sm mb-2">⚠️ Error</div>
        <div className="text-gray-400 text-xs text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Current Slot */}
      <div className="flex flex-col items-center justify-center flex-1 bg-gray-800/50 rounded-lg p-4">
        <div className="text-gray-400 text-sm mb-2">Current Slot</div>
        <div className="text-3xl font-bold text-blue-400 font-mono">
          {slot.toLocaleString()}
        </div>
      </div>

      {/* Epoch */}
      <div className="flex flex-col items-center justify-center bg-gray-800/50 rounded-lg p-3">
        <div className="text-gray-400 text-xs mb-1">Epoch</div>
        <div className="text-xl font-semibold text-purple-400 font-mono">
          {epoch}
        </div>
      </div>

      {/* Estimated Time */}
      <div className="flex flex-col items-center justify-center bg-gray-800/50 rounded-lg p-3">
        <div className="text-gray-400 text-xs mb-1">Estimated Time</div>
        <div className="text-sm text-gray-300 font-mono">
          {estimatedHours}h {estimatedMinutes % 60}m {estimatedSeconds % 60}s
        </div>
      </div>

      {/* RPC Endpoint */}
      <div className="text-center text-xs text-gray-500">
        {solanaClient.getCurrentEndpoint().name}
      </div>
    </div>
  );
};

export default BlockClockWidget;
