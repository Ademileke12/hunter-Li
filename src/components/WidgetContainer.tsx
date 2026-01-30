import React, { useRef, useState, useCallback } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { X, RefreshCw, Copy } from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';
import { useCanvasStore } from '../stores/canvasStore';
import type { WidgetInstance, Position, Size } from '../types';
import 'react-resizable/css/styles.css';
import './WidgetContainer.css';

interface WidgetContainerProps {
  instance: WidgetInstance;
  children: React.ReactNode;
  onMove?: (id: string, position: Position) => void;
  onResize?: (id: string, size: Size) => void;
  onClose?: (id: string) => void;
  onRefresh?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

// Minimum size constraints per widget type
const MIN_SIZES: Record<string, Size> = {
  dexscreener: { width: 400, height: 300 },
  dextools: { width: 400, height: 300 },
  birdeye: { width: 300, height: 200 },
  'new-pairs': { width: 400, height: 300 },
  trending: { width: 400, height: 300 },
  'token-overview': { width: 300, height: 200 },
  'holder-distribution': { width: 300, height: 250 },
  'lp-overview': { width: 300, height: 200 },
  'token-age': { width: 250, height: 150 },
  'deployer-info': { width: 300, height: 200 },
  'risk-flags': { width: 300, height: 250 },
  swap: { width: 350, height: 400 },
  'quick-buy': { width: 350, height: 350 },
  'twitter-embed': { width: 350, height: 400 },
  'telegram-channel': { width: 350, height: 400 },
  'rss-feed': { width: 400, height: 300 },
  notes: { width: 300, height: 200 },
  checklist: { width: 300, height: 250 },
  'block-clock': { width: 250, height: 150 },
  'pnl-tracker': { width: 400, height: 300 },
};

// Default minimum size if widget type not found
const DEFAULT_MIN_SIZE: Size = { width: 250, height: 150 };

/**
 * WidgetContainer Component
 * 
 * A draggable and resizable container for widgets with glassmorphism styling.
 * Features:
 * - Drag by title bar
 * - Resize handles
 * - Close, refresh, duplicate buttons
 * - Minimum size constraints per widget type
 * - Glassmorphism styling with shadows
 */
export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  instance,
  children,
  onMove,
  onResize,
  onClose,
  onRefresh,
  onDuplicate,
}) => {
  const { t } = useTranslation();
  const { updateWidget, removeWidget, duplicateWidget } = useCanvasStore();
  const nodeRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  // Get minimum size for this widget type
  const minSize = MIN_SIZES[instance.type] || DEFAULT_MIN_SIZE;

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag stop
  const handleDragStop = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      setIsDragging(false);
      const newPosition: Position = { x: data.x, y: data.y };

      // Call custom handler if provided
      if (onMove) {
        onMove(instance.id, newPosition);
      } else {
        // Default: update store
        updateWidget(instance.id, { position: newPosition });
      }
    },
    [instance.id, onMove, updateWidget]
  );

  // Handle resize stop
  const handleResizeStop = useCallback(
    (_e: React.SyntheticEvent, data: { size: Size }) => {
      const newSize: Size = {
        width: Math.max(data.size.width, minSize.width),
        height: Math.max(data.size.height, minSize.height),
      };

      // Call custom handler if provided
      if (onResize) {
        onResize(instance.id, newSize);
      } else {
        // Default: update store
        updateWidget(instance.id, { size: newSize });
      }
    },
    [instance.id, minSize, onResize, updateWidget]
  );

  // Handle close button
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose(instance.id);
    } else {
      // Default: remove from store
      removeWidget(instance.id);
    }
  }, [instance.id, onClose, removeWidget]);

  // Handle refresh button
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh(instance.id);
    }
    // If no custom handler, widgets can implement their own refresh logic
  }, [instance.id, onRefresh]);

  // Handle duplicate button
  const handleDuplicate = useCallback(() => {
    if (onDuplicate) {
      onDuplicate(instance.id);
    } else {
      // Default: duplicate in store
      duplicateWidget(instance.id);
    }
  }, [instance.id, onDuplicate, duplicateWidget]);

  // Get widget title (use type as fallback)
  const widgetTitle = instance.config.title || instance.type;

  return (
    <Draggable
      nodeRef={nodeRef}
      position={instance.position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      handle=".widget-title-bar"
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className="widget-container"
        style={{
          position: 'absolute',
          zIndex: instance.zIndex,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        <ResizableBox
          width={instance.size.width}
          height={instance.size.height}
          minConstraints={[minSize.width, minSize.height]}
          onResizeStop={handleResizeStop}
          resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'e', 'w', 'n']}
          className="widget-resizable"
        >
          <div
            className="widget-content-wrapper w-full h-full flex flex-col rounded-xl overflow-hidden
                bg-white/80 dark:bg-[#0f0f19]/85 backdrop-blur-md
                border border-gray-200/50 dark:border-white/10
                shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
          >
            {/* Title Bar */}
            <div
              className="widget-title-bar flex items-center justify-between px-3 py-2
                bg-gray-100/90 dark:bg-[#141423]/90
                border-b border-gray-200/50 dark:border-white/10
                cursor-grab select-none"
            >
              {/* Title */}
              <div className="text-sm font-semibold text-gray-800 dark:text-[#e0e0e0] capitalize">
                {widgetTitle}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-1.5 items-center">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  title={t('common.refresh')}
                  className="widget-control-btn p-1 bg-transparent border-none rounded cursor-pointer flex items-center justify-center
                    text-gray-500 dark:text-[#a0a0a0] transition-colors duration-200
                    hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-[#6464ff]"
                >
                  <RefreshCw size={16} />
                </button>

                {/* Duplicate Button */}
                <button
                  onClick={handleDuplicate}
                  title={t('common.duplicate')}
                  className="widget-control-btn p-1 bg-transparent border-none rounded cursor-pointer flex items-center justify-center
                    text-gray-500 dark:text-[#a0a0a0] transition-colors duration-200
                    hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-[#6464ff]"
                >
                  <Copy size={16} />
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  title={t('common.close')}
                  className="widget-control-btn p-1 bg-transparent border-none rounded cursor-pointer flex items-center justify-center
                    text-gray-500 dark:text-[#a0a0a0] transition-colors duration-200
                    hover:bg-red-500/10 hover:text-red-600 dark:hover:text-[#ff6464]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Widget Content */}
            <div className="widget-content flex-1 overflow-auto p-3">
              {children}
            </div>
          </div>
        </ResizableBox>
      </div>
    </Draggable>
  );
};
