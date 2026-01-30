import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { I18nProvider } from '../contexts/I18nContext';
import type { WidgetInstance } from '../types';

/**
 * Example usage of WidgetContainer component
 * 
 * This example demonstrates:
 * 1. Basic widget rendering
 * 2. Custom event handlers
 * 3. Different widget types with minimum size constraints
 */

// Example widget instances
const exampleWidgets: WidgetInstance[] = [
  {
    id: 'widget-1',
    type: 'notes',
    position: { x: 50, y: 50 },
    size: { width: 400, height: 300 },
    zIndex: 1,
    config: { title: 'My Notes' },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'widget-2',
    type: 'swap',
    position: { x: 500, y: 50 },
    size: { width: 400, height: 500 },
    zIndex: 2,
    config: { title: 'Token Swap' },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'widget-3',
    type: 'token-overview',
    position: { x: 50, y: 400 },
    size: { width: 400, height: 300 },
    zIndex: 3,
    config: { title: 'Token Overview' },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const WidgetContainerExample: React.FC = () => {
  const handleMove = (id: string, position: { x: number; y: number }) => {
    console.log(`Widget ${id} moved to:`, position);
  };

  const handleResize = (id: string, size: { width: number; height: number }) => {
    console.log(`Widget ${id} resized to:`, size);
  };

  const handleClose = (id: string) => {
    console.log(`Widget ${id} closed`);
  };

  const handleRefresh = (id: string) => {
    console.log(`Widget ${id} refreshed`);
  };

  const handleDuplicate = (id: string) => {
    console.log(`Widget ${id} duplicated`);
  };

  return (
    <I18nProvider>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#0a0a0f',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <h1
          style={{
            color: '#fff',
            padding: '20px',
            margin: 0,
            fontSize: '24px',
            fontWeight: 600,
          }}
        >
          WidgetContainer Example
        </h1>

        {exampleWidgets.map((widget) => (
          <WidgetContainer
            key={widget.id}
            instance={widget}
            onMove={handleMove}
            onResize={handleResize}
            onClose={handleClose}
            onRefresh={handleRefresh}
            onDuplicate={handleDuplicate}
          >
            {/* Widget content */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#a0a0a0',
                fontSize: '14px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p>Widget Type: {widget.type}</p>
                <p>Widget ID: {widget.id}</p>
                <p style={{ marginTop: '20px', fontSize: '12px' }}>
                  Try dragging by the title bar or resizing by the edges!
                </p>
              </div>
            </div>
          </WidgetContainer>
        ))}
      </div>
    </I18nProvider>
  );
};

export default WidgetContainerExample;
