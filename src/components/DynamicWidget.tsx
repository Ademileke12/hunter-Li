import React, { Suspense, lazy, ComponentType } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';
import type { WidgetInstance } from '../types';

interface DynamicWidgetProps {
  instance: WidgetInstance;
}

/**
 * Widget component map using React.lazy for code splitting
 * Each widget is loaded dynamically only when needed
 */
const widgetComponents: Record<string, React.LazyExoticComponent<ComponentType<any>>> = {
  // Discovery widgets
  dexscreener: lazy(() => import('../widgets/DexScreenerWidget')),
  dextools: lazy(() => import('../widgets/DexToolsWidget')),
  birdeye: lazy(() => import('../widgets/BirdeyeWidget')),
  'new-pairs': lazy(() => import('../widgets/NewPairsWidget')),
  trending: lazy(() => import('../widgets/TrendingWidget')),
  
  // Analysis widgets
  'token-overview': lazy(() => import('../widgets/TokenOverviewWidget')),
  'holder-distribution': lazy(() => import('../widgets/HolderDistributionWidget')),
  'lp-overview': lazy(() => import('../widgets/LPOverviewWidget')),
  'token-age': lazy(() => import('../widgets/TokenAgeWidget')),
  'deployer-info': lazy(() => import('../widgets/DeployerInfoWidget')),
  'risk-flags': lazy(() => import('../widgets/RiskFlagsWidget')),
  
  // Execution widgets
  swap: lazy(() => import('../widgets/SwapWidget')),
  'quick-buy': lazy(() => import('../widgets/QuickBuyWidget')),
  
  // Alpha feed widgets
  'twitter-embed': lazy(() => import('../widgets/TwitterEmbedWidget')),
  'telegram-channel': lazy(() => import('../widgets/TelegramChannelWidget')),
  'rss-feed': lazy(() => import('../widgets/RSSFeedWidget')),
  
  // Utility widgets
  notes: lazy(() => import('../widgets/NotesWidget')),
  checklist: lazy(() => import('../widgets/ChecklistWidget')),
  'block-clock': lazy(() => import('../widgets/BlockClockWidget')),
  'pnl-tracker': lazy(() => import('../widgets/PnLTrackerWidget')),
};

/**
 * DynamicWidget Component
 * 
 * Dynamically loads and renders widgets based on their type.
 * Features:
 * - React.lazy for code splitting per widget
 * - Suspense with skeleton loader for loading state
 * - ErrorBoundary wrapper for error isolation
 * - Type-safe widget loading
 * 
 * Requirements: 4.10, 19.3
 */
export const DynamicWidget: React.FC<DynamicWidgetProps> = ({ instance }) => {
  // Get the lazy-loaded component for this widget type
  const WidgetComponent = widgetComponents[instance.type];

  // If widget type is not found, show error
  if (!WidgetComponent) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#ff6464',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            Unknown Widget Type
          </div>
          <div style={{ fontSize: '14px', color: '#a0a0a0' }}>
            Widget type "{instance.type}" is not registered
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      widgetId={instance.id}
      widgetType={instance.type}
      onReset={() => {
        // Reset widget state on error recovery
        console.log(`Resetting widget ${instance.id}`);
      }}
    >
      <Suspense fallback={<SkeletonLoader />}>
        <WidgetComponent instance={instance} />
      </Suspense>
    </ErrorBoundary>
  );
};
