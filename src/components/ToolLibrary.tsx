import React from 'react';
import { useTranslation } from '../contexts/I18nContext';
import { useUIStore } from '../stores/uiStore';
import { useCanvasStore } from '../stores/canvasStore';
import { getWidgetsByCategory } from '../utils/widgetRegistry';
import type { WidgetCategory, WidgetType } from '../types';
import * as Icons from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ToolLibrary Component
 * 
 * Collapsible sidebar that displays available widgets organized by category.
 * Users can click on widgets to add them to the canvas.
 * 
 * Features:
 * - Collapsible/expandable sidebar
 * - Category sections with icons
 * - Translated labels for categories and widgets
 * - Click to add widget to canvas
 * - Dark theme with smooth transitions
 * - Glassmorphism styling
 */
export function ToolLibrary() {
  const { t } = useTranslation();
  const { toolLibraryCollapsed, toggleToolLibrary } = useUIStore();
  const { addWidget } = useCanvasStore();

  // Define categories in order
  const categories: WidgetCategory[] = ['discovery', 'analysis', 'execution', 'alpha', 'utilities'];

  // Handle widget click - add to canvas
  const handleWidgetClick = (widgetType: WidgetType) => {
    // Add widget at default position (will be handled by canvas store)
    addWidget(widgetType);
  };

  // Get icon component from lucide-react
  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Box; // Fallback to Box icon
  };

  return (
    <div
      className={`
        fixed left-0 top-16 bottom-0 z-40
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50
        transition-all duration-300 ease-in-out
        ${toolLibraryCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleToolLibrary}
        className="
          absolute -right-3 top-4 z-50
          w-6 h-6 rounded-full
          bg-blue-500 hover:bg-blue-600
          text-white
          flex items-center justify-center
          transition-all duration-200
          shadow-lg hover:shadow-xl
        "
        aria-label={toolLibraryCollapsed ? 'Expand tool library' : 'Collapse tool library'}
      >
        {toolLibraryCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Scrollable Content */}
      <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="p-2">
          {categories.map((category) => {
            const widgets = getWidgetsByCategory(category);

            return (
              <div key={category} className="mb-4">
                {/* Category Header */}
                <div
                  className={`
                    px-3 py-2 mb-2
                    text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider
                    ${toolLibraryCollapsed ? 'text-center' : ''}
                  `}
                >
                  {toolLibraryCollapsed ? (
                    // Show only first letter when collapsed
                    <span className="text-sm">{t(`widgets.categories.${category}`).charAt(0)}</span>
                  ) : (
                    t(`widgets.categories.${category}`)
                  )}
                </div>

                {/* Widget List */}
                <div className="space-y-1">
                  {widgets.map((widget) => {
                    const IconComponent = getIconComponent(widget.icon);

                    return (
                      <button
                        key={widget.type}
                        onClick={() => handleWidgetClick(widget.type)}
                        className={`
                          w-full flex items-center gap-3
                          px-3 py-2.5 rounded-lg
                          text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
                          bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/70 dark:hover:bg-gray-700/70
                          transition-all duration-200
                          group
                          ${toolLibraryCollapsed ? 'justify-center' : ''}
                        `}
                        title={toolLibraryCollapsed ? t(`widgets.widgets.${widget.type}`) : undefined}
                      >
                        {/* Icon */}
                        <IconComponent
                          className="w-5 h-5 flex-shrink-0 group-hover:text-blue-400 transition-colors"
                        />

                        {/* Label - only show when expanded */}
                        {!toolLibraryCollapsed && (
                          <span className="text-sm font-medium truncate">
                            {t(`widgets.widgets.${widget.type}`)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.9);
        }
      `}</style>
    </div>
  );
}
