import React from 'react';
import { DynamicWidget } from './DynamicWidget';
import { WidgetContainer } from './WidgetContainer';
import type { WidgetInstance } from '../types';

/**
 * Example usage of DynamicWidget component
 * 
 * This example demonstrates how to use DynamicWidget with WidgetContainer
 * to create a complete widget system with dynamic loading, error handling,
 * and loading states.
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
    zIndex: 1,
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
    zIndex: 1,
    config: { title: 'Token Overview' },
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Example 1: Basic usage with WidgetContainer
 */
export const BasicExample: React.FC = () => {
  const widget = exampleWidgets[0];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      <WidgetContainer instance={widget}>
        <DynamicWidget instance={widget} />
      </WidgetContainer>
    </div>
  );
};

/**
 * Example 2: Multiple widgets
 */
export const MultipleWidgetsExample: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      {exampleWidgets.map((widget) => (
        <WidgetContainer key={widget.id} instance={widget}>
          <DynamicWidget instance={widget} />
        </WidgetContainer>
      ))}
    </div>
  );
};

/**
 * Example 3: Testing error handling
 */
export const ErrorHandlingExample: React.FC = () => {
  // Create a widget with an unknown type to trigger error state
  const errorWidget: WidgetInstance = {
    id: 'error-widget',
    type: 'unknown-type' as any,
    position: { x: 50, y: 50 },
    size: { width: 400, height: 300 },
    zIndex: 1,
    config: {},
    state: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      <WidgetContainer instance={errorWidget}>
        <DynamicWidget instance={errorWidget} />
      </WidgetContainer>
    </div>
  );
};

/**
 * Example 4: All widget types
 */
export const AllWidgetTypesExample: React.FC = () => {
  const allTypes: WidgetInstance[] = [
    // Discovery widgets
    { id: '1', type: 'dexscreener', position: { x: 50, y: 50 }, size: { width: 400, height: 300 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
    { id: '2', type: 'birdeye', position: { x: 500, y: 50 }, size: { width: 400, height: 300 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
    { id: '3', type: 'new-pairs', position: { x: 950, y: 50 }, size: { width: 400, height: 300 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
    
    // Analysis widgets
    { id: '4', type: 'token-overview', position: { x: 50, y: 400 }, size: { width: 400, height: 300 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
    { id: '5', type: 'risk-flags', position: { x: 500, y: 400 }, size: { width: 400, height: 300 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
    
    // Execution widgets
    { id: '6', type: 'swap', position: { x: 950, y: 400 }, size: { width: 400, height: 500 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
    
    // Utility widgets
    { id: '7', type: 'notes', position: { x: 50, y: 750 }, size: { width: 400, height: 300 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
    { id: '8', type: 'block-clock', position: { x: 500, y: 750 }, size: { width: 300, height: 200 }, zIndex: 1, config: {}, state: {}, createdAt: Date.now(), updatedAt: Date.now() },
  ];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '1200px', background: '#0a0a0f' }}>
      {allTypes.map((widget) => (
        <WidgetContainer key={widget.id} instance={widget}>
          <DynamicWidget instance={widget} />
        </WidgetContainer>
      ))}
    </div>
  );
};

/**
 * Example 5: Demonstrating lazy loading
 * 
 * When you first render a widget, you'll see the skeleton loader
 * while the widget component is being loaded. This demonstrates
 * the code splitting feature.
 */
export const LazyLoadingExample: React.FC = () => {
  const [showWidget, setShowWidget] = React.useState(false);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setShowWidget(true)}
          style={{
            padding: '12px 24px',
            background: '#6464ff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Load Widget (Watch for skeleton loader)
        </button>
      </div>

      {showWidget && (
        <WidgetContainer instance={exampleWidgets[0]}>
          <DynamicWidget instance={exampleWidgets[0]} />
        </WidgetContainer>
      )}
    </div>
  );
};

// Default export for Storybook or other tools
export default {
  title: 'Components/DynamicWidget',
  component: DynamicWidget,
  examples: {
    BasicExample,
    MultipleWidgetsExample,
    ErrorHandlingExample,
    AllWidgetTypesExample,
    LazyLoadingExample,
  },
};
