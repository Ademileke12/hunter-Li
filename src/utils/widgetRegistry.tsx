import React from 'react';
import type { WidgetDefinition, WidgetType } from '../types';

// Lazy load widget components for code splitting
const DexScreenerWidget = React.lazy(() => import('../widgets/DexScreenerWidget'));
const DexToolsWidget = React.lazy(() => import('../widgets/DexToolsWidget'));
const BirdeyeWidget = React.lazy(() => import('../widgets/BirdeyeWidget'));
const NewPairsWidget = React.lazy(() => import('../widgets/NewPairsWidget'));
const TrendingWidget = React.lazy(() => import('../widgets/TrendingWidget'));
const TokenOverviewWidget = React.lazy(() => import('../widgets/TokenOverviewWidget'));
const HolderDistributionWidget = React.lazy(() => import('../widgets/HolderDistributionWidget'));
const LPOverviewWidget = React.lazy(() => import('../widgets/LPOverviewWidget'));
const TokenAgeWidget = React.lazy(() => import('../widgets/TokenAgeWidget'));
const DeployerInfoWidget = React.lazy(() => import('../widgets/DeployerInfoWidget'));
const RiskFlagsWidget = React.lazy(() => import('../widgets/RiskFlagsWidget'));
const SwapWidget = React.lazy(() => import('../widgets/SwapWidget'));
const QuickBuyWidget = React.lazy(() => import('../widgets/QuickBuyWidget'));
const TwitterEmbedWidget = React.lazy(() => import('../widgets/TwitterEmbedWidget'));
const TelegramChannelWidget = React.lazy(() => import('../widgets/TelegramChannelWidget'));
const RSSFeedWidget = React.lazy(() => import('../widgets/RSSFeedWidget'));
const NotesWidget = React.lazy(() => import('../widgets/NotesWidget'));
const ChecklistWidget = React.lazy(() => import('../widgets/ChecklistWidget'));
const BlockClockWidget = React.lazy(() => import('../widgets/BlockClockWidget'));
const PnLTrackerWidget = React.lazy(() => import('../widgets/PnLTrackerWidget'));

/**
 * Widget Registry
 * 
 * Central registry of all available widgets in the system.
 * Each widget definition includes:
 * - type: Unique identifier for the widget
 * - category: Organizational category (discovery, analysis, execution, alpha, utilities)
 * - icon: Icon identifier (using lucide-react or similar icon library)
 * - label: Translation key for the widget label
 * - component: React component to render
 * - defaultSize: Default dimensions when added to canvas
 * - minSize: Minimum allowed dimensions
 * - maxSize: Maximum allowed dimensions (optional)
 * - defaultConfig: Default configuration object
 */
export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  // Discovery Widgets
  'dexscreener': {
    type: 'dexscreener',
    category: 'discovery',
    icon: 'BarChart3',
    label: 'widgets.dexscreener',
    component: DexScreenerWidget,
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    maxSize: { width: 1600, height: 1200 },
    defaultConfig: { tokenAddress: '' },
  },
  'dextools': {
    type: 'dextools',
    category: 'discovery',
    icon: 'TrendingUp',
    label: 'widgets.dextools',
    component: DexToolsWidget,
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    maxSize: { width: 1600, height: 1200 },
    defaultConfig: { tokenAddress: '' },
  },
  'birdeye': {
    type: 'birdeye',
    category: 'discovery',
    icon: 'Eye',
    label: 'widgets.birdeye',
    component: BirdeyeWidget,
    defaultSize: { width: 600, height: 400 },
    minSize: { width: 300, height: 200 },
    maxSize: { width: 1200, height: 800 },
    defaultConfig: { tokenAddress: '' },
  },
  'new-pairs': {
    type: 'new-pairs',
    category: 'discovery',
    icon: 'Sparkles',
    label: 'widgets.new-pairs',
    component: NewPairsWidget,
    defaultSize: { width: 700, height: 500 },
    minSize: { width: 400, height: 300 },
    maxSize: { width: 1400, height: 1000 },
    defaultConfig: { limit: 20, autoRefresh: true, refreshInterval: 30000 },
  },
  'trending': {
    type: 'trending',
    category: 'discovery',
    icon: 'Flame',
    label: 'widgets.trending',
    component: TrendingWidget,
    defaultSize: { width: 700, height: 500 },
    minSize: { width: 400, height: 300 },
    maxSize: { width: 1400, height: 1000 },
    defaultConfig: { limit: 20, autoRefresh: true, refreshInterval: 30000 },
  },

  // Analysis Widgets
  'token-overview': {
    type: 'token-overview',
    category: 'analysis',
    icon: 'Info',
    label: 'widgets.token-overview',
    component: TokenOverviewWidget,
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    maxSize: { width: 800, height: 600 },
    defaultConfig: { tokenAddress: '' },
  },
  'holder-distribution': {
    type: 'holder-distribution',
    category: 'analysis',
    icon: 'PieChart',
    label: 'widgets.holder-distribution',
    component: HolderDistributionWidget,
    defaultSize: { width: 500, height: 400 },
    minSize: { width: 300, height: 300 },
    maxSize: { width: 1000, height: 800 },
    defaultConfig: { tokenAddress: '' },
  },
  'lp-overview': {
    type: 'lp-overview',
    category: 'analysis',
    icon: 'Droplet',
    label: 'widgets.lp-overview',
    component: LPOverviewWidget,
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    maxSize: { width: 800, height: 600 },
    defaultConfig: { tokenAddress: '' },
  },
  'token-age': {
    type: 'token-age',
    category: 'analysis',
    icon: 'Clock',
    label: 'widgets.token-age',
    component: TokenAgeWidget,
    defaultSize: { width: 350, height: 250 },
    minSize: { width: 250, height: 150 },
    maxSize: { width: 700, height: 500 },
    defaultConfig: { tokenAddress: '' },
  },
  'deployer-info': {
    type: 'deployer-info',
    category: 'analysis',
    icon: 'User',
    label: 'widgets.deployer-info',
    component: DeployerInfoWidget,
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    maxSize: { width: 800, height: 600 },
    defaultConfig: { tokenAddress: '' },
  },
  'risk-flags': {
    type: 'risk-flags',
    category: 'analysis',
    icon: 'AlertTriangle',
    label: 'widgets.risk-flags',
    component: RiskFlagsWidget,
    defaultSize: { width: 450, height: 350 },
    minSize: { width: 300, height: 250 },
    maxSize: { width: 900, height: 700 },
    defaultConfig: { tokenAddress: '' },
  },

  // Execution Widgets
  'swap': {
    type: 'swap',
    category: 'execution',
    icon: 'ArrowLeftRight',
    label: 'widgets.swap',
    component: SwapWidget,
    defaultSize: { width: 400, height: 500 },
    minSize: { width: 350, height: 400 },
    maxSize: { width: 600, height: 800 },
    defaultConfig: {
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: '',
      slippageBps: 100, // 1%
    },
  },
  'quick-buy': {
    type: 'quick-buy',
    category: 'execution',
    icon: 'Zap',
    label: 'widgets.quick-buy',
    component: QuickBuyWidget,
    defaultSize: { width: 350, height: 400 },
    minSize: { width: 300, height: 350 },
    maxSize: { width: 500, height: 600 },
    defaultConfig: { tokenAddress: '' },
  },

  // Alpha Feed Widgets
  'twitter-embed': {
    type: 'twitter-embed',
    category: 'alpha',
    icon: 'Twitter',
    label: 'widgets.twitter-embed',
    component: TwitterEmbedWidget,
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 300, height: 400 },
    maxSize: { width: 600, height: 1000 },
    defaultConfig: { tweetUrl: '', username: '' },
  },
  'telegram-channel': {
    type: 'telegram-channel',
    category: 'alpha',
    icon: 'MessageCircle',
    label: 'widgets.telegram-channel',
    component: TelegramChannelWidget,
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 300, height: 400 },
    maxSize: { width: 600, height: 1000 },
    defaultConfig: { channelUsername: '', autoRefresh: true, refreshInterval: 60000 },
  },
  'rss-feed': {
    type: 'rss-feed',
    category: 'alpha',
    icon: 'Rss',
    label: 'widgets.rss-feed',
    component: RSSFeedWidget,
    defaultSize: { width: 500, height: 600 },
    minSize: { width: 350, height: 400 },
    maxSize: { width: 800, height: 1000 },
    defaultConfig: {
      feedUrl: 'https://solana.com/rss.xml',
      limit: 10,
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes
    },
  },

  // Utility Widgets
  'notes': {
    type: 'notes',
    category: 'utilities',
    icon: 'FileText',
    label: 'widgets.notes',
    component: NotesWidget,
    defaultSize: { width: 400, height: 400 },
    minSize: { width: 250, height: 200 },
    maxSize: { width: 800, height: 800 },
    defaultConfig: { content: '' },
  },
  'checklist': {
    type: 'checklist',
    category: 'utilities',
    icon: 'CheckSquare',
    label: 'widgets.checklist',
    component: ChecklistWidget,
    defaultSize: { width: 350, height: 400 },
    minSize: { width: 250, height: 250 },
    maxSize: { width: 600, height: 800 },
    defaultConfig: { items: [] },
  },
  'block-clock': {
    type: 'block-clock',
    category: 'utilities',
    icon: 'Timer',
    label: 'widgets.block-clock',
    component: BlockClockWidget,
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 250, height: 150 },
    maxSize: { width: 500, height: 300 },
    defaultConfig: { autoRefresh: true, refreshInterval: 400 },
  },
  'pnl-tracker': {
    type: 'pnl-tracker',
    category: 'utilities',
    icon: 'DollarSign',
    label: 'widgets.pnl-tracker',
    component: PnLTrackerWidget,
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 400, height: 350 },
    maxSize: { width: 1000, height: 800 },
    defaultConfig: { entries: [] },
  },
};

/**
 * Get widget definition by type
 * @param type - Widget type identifier
 * @returns Widget definition or undefined if not found
 */
export function getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
  return widgetRegistry[type];
}

/**
 * Get all widget definitions for a specific category
 * @param category - Widget category
 * @returns Array of widget definitions in the category
 */
export function getWidgetsByCategory(category: string): WidgetDefinition[] {
  return Object.values(widgetRegistry).filter((def) => def.category === category);
}

/**
 * Get all available widget categories
 * @returns Array of unique category names
 */
export function getWidgetCategories(): string[] {
  const categories = new Set(Object.values(widgetRegistry).map((def) => def.category));
  return Array.from(categories);
}

/**
 * Check if a widget type exists in the registry
 * @param type - Widget type to check
 * @returns True if widget type exists
 */
export function isValidWidgetType(type: string): type is WidgetType {
  return type in widgetRegistry;
}
