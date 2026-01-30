/**
 * Example usage of InfiniteCanvas component
 * 
 * This file demonstrates how to use the InfiniteCanvas component
 * with widgets and other canvas elements.
 */

import React from 'react';
import { InfiniteCanvas } from './InfiniteCanvas';
import { useCanvasStore } from '../stores/canvasStore';

export const InfiniteCanvasExample: React.FC = () => {
  const { widgets } = useCanvasStore();

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <InfiniteCanvas>
        {/* Render widgets */}
        {widgets.map((widget) => (
          <div
            key={widget.id}
            style={{
              position: 'absolute',
              left: widget.position.x,
              top: widget.position.y,
              width: widget.size.width,
              height: widget.size.height,
              backgroundColor: '#1a1a2e',
              border: '1px solid #3b3b5c',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3 style={{ color: '#fff', margin: 0 }}>
              {widget.type}
            </h3>
            <p style={{ color: '#888', fontSize: '12px' }}>
              Position: ({widget.position.x}, {widget.position.y})
            </p>
          </div>
        ))}

        {/* Grid background (optional) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '10000px',
            height: '10000px',
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            pointerEvents: 'none',
          }}
        />
      </InfiniteCanvas>
    </div>
  );
};

/**
 * Usage Instructions:
 * 
 * 1. Pan the canvas:
 *    - Middle mouse button + drag
 *    - Space + left mouse button + drag
 *    - Arrow keys (↑ ↓ ← →)
 * 
 * 2. Zoom the canvas:
 *    - Ctrl + mouse wheel (or Cmd + mouse wheel on Mac)
 *    - Zoom in: scroll up
 *    - Zoom out: scroll down
 * 
 * 3. The canvas supports:
 *    - Infinite panning in all directions
 *    - Zoom range: 0.1x to 5.0x
 *    - Smooth CSS transforms for rendering
 *    - Proper cursor states (default, grab, grabbing)
 * 
 * 4. Integration with stores:
 *    - Pan and zoom state is managed by canvasStore
 *    - State persists to localStorage automatically
 *    - Widgets are positioned absolutely within the canvas
 */
