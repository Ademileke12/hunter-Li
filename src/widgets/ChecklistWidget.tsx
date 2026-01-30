import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistWidgetProps {
  widgetId: string;
}

const ChecklistWidget: React.FC<ChecklistWidgetProps> = ({ widgetId }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const storageKey = `checklist_${widgetId}`;

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load checklist:', error);
      }
    }
  }, [storageKey]);

  // Save to localStorage
  useEffect(() => {
    if (items.length > 0 || localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, storageKey]);

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        checked: false,
      };
      setItems([...items, newItem]);
      setNewItemText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setItems(newItems);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gray-900/50">
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('widgets.checklist.addItem')}
            className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={addItem}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            {t('widgets.checklist.add')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {t('widgets.checklist.empty')}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-gray-800/50 rounded border border-gray-700 cursor-move hover:border-gray-600 transition-colors ${
                draggedItem === item.id ? 'opacity-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                className="w-5 h-5 cursor-pointer accent-blue-600"
              />
              <span
                className={`flex-1 ${
                  item.checked ? 'line-through text-gray-500' : 'text-white'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                aria-label={t('widgets.checklist.delete')}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


export default ChecklistWidget;
