// Core type definitions for Alpha Hunter Crypto Workspace

export type Language = 'en' | 'zh-CN';

export type WidgetCategory = 'discovery' | 'analysis' | 'execution' | 'alpha' | 'utilities';

export type WidgetType =
  | 'dexscreener'
  | 'dextools'
  | 'birdeye'
  | 'new-pairs'
  | 'trending'
  | 'token-overview'
  | 'holder-distribution'
  | 'lp-overview'
  | 'token-age'
  | 'deployer-info'
  | 'risk-flags'
  | 'swap'
  | 'quick-buy'
  | 'twitter-embed'
  | 'telegram-channel'
  | 'rss-feed'
  | 'notes'
  | 'checklist'
  | 'block-clock'
  | 'pnl-tracker';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  zIndex: number;
  config: Record<string, any>;
  state: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Viewport {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface Annotation {
  id: string;
  type: 'pencil' | 'arrow' | 'highlight' | 'text';
  points?: number[];
  rect?: { x: number; y: number; width: number; height: number };
  text?: string;
  position?: Position;
  color: string;
  strokeWidth: number;
  timestamp: number;
}

export interface Workspace {
  language: Language;
  widgets: WidgetInstance[];
  annotations: Annotation[];
  viewport: Viewport;
  zoom: number;
  pan: Position;
  version: number;
  lastModified: number;
}

export type TranslationMap = Record<string, string | Record<string, any>>;

export interface WidgetDefinition {
  type: WidgetType;
  category: WidgetCategory;
  icon: string;
  label: string;
  component: React.ComponentType<any>;
  defaultSize: Size;
  minSize: Size;
  maxSize?: Size;
  defaultConfig: Record<string, any>;
}

// Wallet types
export type WalletProvider = 'phantom' | 'solflare' | 'backpack' | 'walletConnect';

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  provider: WalletProvider | null;
  balance: number;
}

// Drawing/Annotation types
export type DrawingTool = 'pencil' | 'arrow' | 'highlight' | 'text';
// Re-export Birdeye types
export type {
  TokenOverview,
  TokenInfo,
  TokenPair,
  HolderData,
  TrendingToken,
} from './birdeye';

// Re-export Jupiter types
export type {
  QuoteParams,
  RouteInfo,
  SwapQuote,
  SwapParams,
  SwapResult,
  SwapTransaction,
} from './jupiter';
