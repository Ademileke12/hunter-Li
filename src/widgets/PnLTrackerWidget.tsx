import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface PnLEntry {
  id: string;
  token: string;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  timestamp: number;
}

interface PnLTrackerWidgetProps {
  widgetId: string;
}

const PnLTrackerWidget: React.FC<PnLTrackerWidgetProps> = ({ widgetId }) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PnLEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    token: '',
    entryPrice: '',
    exitPrice: '',
    amount: '',
  });

  const storageKey = `pnl_tracker_${widgetId}`;

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load PnL entries:', error);
      }
    }
  }, [storageKey]);

  // Save to localStorage
  useEffect(() => {
    if (entries.length > 0 || localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    }
  }, [entries, storageKey]);

  const calculatePnL = (entryPrice: number, exitPrice: number, amount: number): number => {
    return (exitPrice - entryPrice) * amount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice = parseFloat(formData.exitPrice);
    const amount = parseFloat(formData.amount);

    if (!formData.token || isNaN(entryPrice) || isNaN(exitPrice) || isNaN(amount)) {
      return;
    }

    const pnl = calculatePnL(entryPrice, exitPrice, amount);

    const newEntry: PnLEntry = {
      id: Date.now().toString(),
      token: formData.token,
      entryPrice,
      exitPrice,
      amount,
      pnl,
      timestamp: Date.now(),
    };

    setEntries([...entries, newEntry]);
    setFormData({ token: '', entryPrice: '', exitPrice: '', amount: '' });
    setShowModal(false);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const totalPnL = entries.reduce((sum, entry) => sum + entry.pnl, 0);

  return (
    <div className="h-full flex flex-col p-4 bg-gray-900/50">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {t('widgets.pnl-tracker')}
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
        >
          {t('widgets.pnlTracker.addEntry')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {t('widgets.pnlTracker.empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-2">{t('widgets.pnlTracker.token')}</th>
                  <th className="text-right py-2 px-2">{t('widgets.pnlTracker.entry')}</th>
                  <th className="text-right py-2 px-2">{t('widgets.pnlTracker.exit')}</th>
                  <th className="text-right py-2 px-2">{t('widgets.pnlTracker.amount')}</th>
                  <th className="text-right py-2 px-2">{t('widgets.pnlTracker.pnl')}</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-2 px-2 text-white">{entry.token}</td>
                    <td className="py-2 px-2 text-right text-gray-300">
                      ${entry.entryPrice.toFixed(4)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-300">
                      ${entry.exitPrice.toFixed(4)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-300">
                      {entry.amount.toFixed(2)}
                    </td>
                    <td className={`py-2 px-2 text-right font-semibold ${
                      entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-red-400 hover:text-red-300"
                        aria-label={t('widgets.pnlTracker.delete')}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-semibold">
              {t('widgets.pnlTracker.total')}
            </span>
            <span className={`text-xl font-bold ${
              totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              ${totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t('widgets.pnlTracker.addEntry')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('widgets.pnlTracker.token')}
                </label>
                <input
                  type="text"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="SOL, USDC, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('widgets.pnlTracker.entry')}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('widgets.pnlTracker.exit')}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.exitPrice}
                  onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('widgets.pnlTracker.amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  {t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PnLTrackerWidget;
