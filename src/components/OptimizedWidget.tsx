import React, { memo } from 'react';
import type { WidgetInstance } from '../types';
import { areWidgetPropsEqual } from '../utils/renderOptimizations';

/**
 * Optimized Widget Wrapper
 * 
 * Wraps widget components with React.memo and custom comparison function
 * to prevent unnecessary re-renders.
 * 
 * Only re-renders when:
 * - Widget ID changes
 * - Widget type changes
 * - Widget position changes
 * - Widget size changes
 * - Widget config changes
 * - Widget state changes
 * - Widget z-index changes
 * - Widget updatedAt timestamp changes
 * 
 * Requirements: 18.7
 */

interface OptimizedWidgetProps {
  instance: WidgetInstance;
  children: React.ReactNode;
}

/**
 * Optimized widget wrapper component
 * Uses React.memo with custom comparison function
 */
export const OptimizedWidget = memo<OptimizedWidgetProps>(
  ({ instance, children }) => {
    return <>{children}</>;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (don't re-render)
    // Return false if props are different (re-render)
    return areWidgetPropsEqual(
      { instance: prevProps.instance },
      { instance: nextProps.instance }
    );
  }
);

OptimizedWidget.displayName = 'OptimizedWidget';

/**
 * HOC to wrap widget components with optimization
 */
export function withOptimization<P extends { instance: WidgetInstance }>(
  Component: React.ComponentType<P>
) {
  const OptimizedComponent = memo(Component, (prevProps, nextProps) => {
    return areWidgetPropsEqual(
      { instance: prevProps.instance },
      { instance: nextProps.instance }
    );
  });

  OptimizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`;

  return OptimizedComponent;
}
