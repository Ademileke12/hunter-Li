# Design Document: Alpha Hunter Crypto Workspace

## Overview

The Alpha Hunter Crypto Workspace is a React-based single-page application that provides a professional crypto trading and analysis environment. The system architecture follows a modular, component-based design with clear separation between presentation, state management, and data fetching layers.

The application consists of five primary architectural layers:

1. **Presentation Layer**: React components with TailwindCSS styling
2. **State Management Layer**: Zustand stores for global state
3. **Widget System Layer**: Dynamic widget registry and lifecycle management
4. **Data Layer**: API clients and blockchain interaction services
5. **Persistence Layer**: localStorage and IndexedDB adapters

The design prioritizes performance, modularity, and extensibility while maintaining a clean separation of concerns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Top Bar                               │
│  [Logo] [Language Toggle] [Search] [Wallet Connect]         │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────┐
│          │                                                   │
│   Tool   │           Infinite Canvas                        │
│  Library │                                                   │
│          │    ┌──────────┐  ┌──────────┐                   │
│ Discovery│    │ Widget 1 │  │ Widget 2 │                   │
│ Analysis │    └──────────┘  └──────────┘                   │
│ Execution│                                                   │
│  Alpha   │         ┌──────────┐                            │
│ Utilities│         │ Widget 3 │                            │
│          │         └──────────┘                            │
│          │                                                   │
│          │              [Annotation Layer]                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── I18nProvider
│   └── ThemeProvider
│       ├── WalletProvider
│       │   ├── TopBar
│       │   │   ├── Logo
│       │   │   ├── LanguageToggle
│       │   │   ├── SearchBar
│       │   │   └── WalletButton
│       │   ├── MainLayout
│       │   │   ├── ToolLibrary
│       │   │   │   └── WidgetCategoryList
│       │   │   └── InfiniteCanvas
│       │   │       ├── CanvasViewport
│       │   │       ├── WidgetContainer[]
│       │   │       │   └── DynamicWidget
│       │   │       └── AnnotationLayer
│       │   └── ErrorBoundary
│       └── ToastNotifications
```

## Components and Interfaces

### 1. Internationalization System

**I18nProvider Component**
- Wraps the entire application
- Provides translation context to all child components
- Manages language state and switching logic

**Translation Service Interface**
```typescript
interface TranslationService {
  currentLanguage: Language;
  setLanguage(lang: Language): void;
  t(key: string, params?: Record<string, any>): string;
  loadTranslations(lang: Language): Promise<TranslationMap>;
}

type Language = 'en' | 'zh-CN';
type TranslationMap = Record<string, string>;
```

**Translation File Structure**
```
/locales
  /en
    common.json
    widgets.json
    errors.json
  /zh-CN
    common.json
    widgets.json
    errors.json
```

**Implementation Approach**
- Use React Context API for translation provider
- Store translations in JSON files organized by namespace
- Implement lazy loading for translation files
- Use interpolation for dynamic values in translations
- Persist language preference to localStorage key: `app_language`

### 2. Infinite Canvas System

**Canvas State Interface**
```typescript
interface CanvasState {
  viewport: Viewport;
  widgets: WidgetInstance[];
  annotations: Annotation[];
  zoom: number;
  pan: { x: number; y: number };
}

interface Viewport {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  config: Record<string, any>;
  state: Record<string, any>;
}
```

**Canvas Implementation**
- Use HTML5 Canvas or SVG for rendering annotations
- Use absolute positioning for widgets (CSS transforms)
- Implement pan with mouse drag (middle button or space + drag)
- Implement zoom with mouse wheel (ctrl + wheel)
- Use requestAnimationFrame for smooth rendering
- Implement viewport culling for off-screen widgets

**Interaction Handlers**
- Mouse down: Start drag or resize operation
- Mouse move: Update drag/resize position
- Mouse up: Commit position/size change
- Wheel: Zoom in/out
- Keyboard: Pan with arrow keys, delete with Del key

### 3. Widget System Architecture

**Widget Registry**
```typescript
interface WidgetDefinition {
  type: WidgetType;
  category: WidgetCategory;
  icon: IconComponent;
  label: TranslationKey;
  component: React.ComponentType<WidgetProps>;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  maxSize?: { width: number; height: number };
  defaultConfig: Record<string, any>;
}

type WidgetCategory = 'discovery' | 'analysis' | 'execution' | 'alpha' | 'utilities';

type WidgetType = 
  | 'dexscreener' | 'dextools' | 'birdeye' | 'new-pairs' | 'trending'
  | 'token-overview' | 'holder-distribution' | 'lp-overview' | 'token-age' 
  | 'deployer-info' | 'risk-flags'
  | 'swap' | 'quick-buy'
  | 'twitter-embed' | 'telegram-channel' | 'rss-feed'
  | 'notes' | 'checklist' | 'block-clock' | 'pnl-tracker';
```

**Widget Container Component**
```typescript
interface WidgetContainerProps {
  instance: WidgetInstance;
  onMove: (id: string, position: Position) => void;
  onResize: (id: string, size: Size) => void;
  onClose: (id: string) => void;
  onRefresh: (id: string) => void;
  onDuplicate: (id: string) => void;
}
```

**Widget Lifecycle**
1. User clicks widget in Tool Library
2. System creates WidgetInstance with unique ID
3. System adds instance to canvas state
4. WidgetContainer renders with dynamic component
5. Widget component mounts and loads data
6. User interacts with widget
7. Widget state persists to localStorage on change
8. User closes widget, system removes from canvas state

### 4. State Management

**Zustand Store Structure**
```typescript
// Canvas Store
interface CanvasStore {
  widgets: WidgetInstance[];
  viewport: Viewport;
  zoom: number;
  pan: Position;
  annotations: Annotation[];
  addWidget: (type: WidgetType, position?: Position) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetInstance>) => void;
  duplicateWidget: (id: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Position) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  loadWorkspace: (language: Language) => void;
  saveWorkspace: () => void;
}

// Wallet Store
interface WalletStore {
  connected: boolean;
  publicKey: string | null;
  provider: WalletProvider | null;
  balance: number;
  connect: (provider: WalletProvider) => Promise<void>;
  disconnect: () => void;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

// UI Store
interface UIStore {
  toolLibraryCollapsed: boolean;
  annotationMode: boolean;
  selectedTool: DrawingTool | null;
  toggleToolLibrary: () => void;
  setAnnotationMode: (enabled: boolean) => void;
  setSelectedTool: (tool: DrawingTool | null) => void;
}
```

### 5. Data Layer

**API Client Interfaces**
```typescript
// Birdeye API Client
interface BirdeyeClient {
  getTokenOverview(address: string): Promise<TokenOverview>;
  getHolderDistribution(address: string): Promise<HolderData[]>;
  getNewPairs(limit: number): Promise<TokenPair[]>;
  getTrendingTokens(limit: number): Promise<TrendingToken[]>;
}

// Solana RPC Client
interface SolanaClient {
  getConnection(): Connection;
  getTokenAccountsByOwner(owner: PublicKey): Promise<TokenAccount[]>;
  getTokenSupply(mint: PublicKey): Promise<TokenSupply>;
  getAccountInfo(address: PublicKey): Promise<AccountInfo>;
  getCurrentSlot(): Promise<number>;
}

// Jupiter SDK Client
interface JupiterClient {
  getQuote(params: QuoteParams): Promise<Quote>;
  executeSwap(params: SwapParams): Promise<SwapResult>;
}

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}
```

**Data Fetching Strategy**
- Use React Query (TanStack Query) for API data caching
- Implement stale-while-revalidate pattern
- Cache duration: 30 seconds for market data, 5 minutes for static data
- Implement request deduplication for concurrent requests
- Use exponential backoff for failed requests
- Implement fallback RPC endpoints for reliability

### 6. Widget Implementations

**Discovery Widgets**

*DexScreener Widget*
- Embed DexScreener using iframe
- URL format: `https://dexscreener.com/solana/{tokenAddress}`
- Implement iframe sandbox security
- Handle iframe load errors with fallback UI

*Birdeye Widget*
- Fetch data from Birdeye public API: `https://public-api.birdeye.so`
- Display token price, volume, market cap
- Implement auto-refresh every 30 seconds
- Show loading skeleton during fetch

*New Pairs Widget*
- Fetch recent pairs from Birdeye `/defi/v3/pairs/new` endpoint
- Display table with: token symbol, age, liquidity, volume
- Highlight tokens < 24h old with blue badge
- Implement pagination for large result sets

*Trending Tokens Widget*
- Fetch trending data from Birdeye `/defi/v3/tokens/trending` endpoint
- Calculate volume spike: (current_volume - avg_24h_volume) / avg_24h_volume
- Highlight tokens with >100% volume spike
- Display sparkline charts for price movement

**Analysis Widgets**

*Token Overview Widget*
- Input: Token address (text field or from search)
- Display: Name, symbol, supply, price, market cap, 24h volume
- Fetch from Birdeye `/defi/v3/token/overview` endpoint
- Show token logo if available

*Holder Distribution Widget*
- Fetch from Birdeye `/defi/v3/token/holder` endpoint
- Display pie chart of top 10 holders
- Show percentage for each holder
- Calculate concentration: sum of top 10 holder percentages
- Use recharts library for visualization

*LP Overview Widget*
- Fetch liquidity pool data from Birdeye
- Display: LP locked percentage, LP value, LP providers count
- Show warning if LP < 50%
- Display LP lock duration if available

*Risk Flags Widget*
- Calculate risk score based on:
  - LP percentage: score += (50 - lp_percent) if lp_percent < 50
  - Holder concentration: score += (top10_percent - 50) if top10_percent > 50
  - Deployer activity: score += 30 if deployer moved tokens in 24h
- Risk levels: Low (0-30), Medium (31-60), High (61-80), Critical (81+)
- Display specific flags: "Low LP", "High Concentration", "Deployer Active"
- Color code: green, yellow, orange, red

**Execution Widgets**

*Swap Widget*
- Input token selector (dropdown with search)
- Output token selector (dropdown with search)
- Amount input field
- Quick buy buttons: 0.1, 0.5, 1, 5, 10 SOL
- Slippage selector: 0.5%, 1%, 2%, custom input
- Display quote: expected output, price impact, minimum received
- Swap button (disabled if wallet not connected)
- Transaction status indicator
- Use Jupiter SDK v6 for routing and execution

**Alpha Feed Widgets**

*Twitter Embed Widget*
- Configuration: Twitter username or tweet URL
- Use Twitter embed API: `https://publish.twitter.com/oembed`
- Display embedded tweet in iframe
- Handle embed failures gracefully

*Telegram Channel Widget*
- Configuration: Public channel username
- Use Telegram Widget API for read-only display
- Display recent messages (last 20)
- Show timestamp and sender for each message
- Auto-refresh every 60 seconds

*RSS Feed Widget*
- Configuration: RSS feed URL (default: Solana news aggregator)
- Parse RSS XML using DOMParser
- Display: title, description, link, publish date
- Limit to 10 most recent items
- Implement click to open in new tab

**Utility Widgets**

*Notes Widget*
- Rich text editor using TipTap or Slate
- Support: bold, italic, lists, links
- Auto-save to localStorage on change (debounced 500ms)
- Persist per widget instance ID

*Checklist Widget*
- List of checkbox items
- Add new item with Enter key
- Delete item with delete button
- Reorder items with drag and drop
- Persist to localStorage

*Block Clock Widget*
- Fetch current slot from Solana RPC: `getSlot()`
- Calculate estimated time: slot * 400ms
- Display: current slot, estimated time, epoch
- Update every 400ms (Solana block time)

*PnL Tracker Widget*
- Table with columns: token, entry price, exit price, amount, PnL
- Add entry button opens modal form
- Calculate PnL: (exit_price - entry_price) * amount
- Display total PnL at bottom
- Persist entries to localStorage

### 7. Annotation Layer

**Annotation Data Model**
```typescript
interface Annotation {
  id: string;
  type: 'pencil' | 'arrow' | 'highlight' | 'text';
  points?: number[]; // For pencil and arrow
  rect?: { x: number; y: number; width: number; height: number }; // For highlight
  text?: string; // For text notes
  position?: { x: number; y: number }; // For text notes
  color: string;
  strokeWidth: number;
  timestamp: number;
}
```

**Drawing Tools Implementation**
- Use Konva.js or Fabric.js for canvas drawing
- Pencil: Free-form drawing with mouse/touch
- Arrow: Click start point, drag to end point
- Highlight: Click and drag to create rectangle with transparency
- Text: Click to place, type text, click outside to finish

**Annotation Persistence**
- Store annotations array in localStorage
- Key format: `workspace_annotations_{language}`
- Serialize to JSON before storage
- Deserialize on load and render to canvas

### 8. Fast Buy Flow

**Fast Buy Trigger**
- Triggered from: Search bar selection, discovery widget click
- Input: Token address

**Fast Buy Sequence**
1. Create chart widget (DexScreener) with token address
2. Create token overview widget with token address
3. Create swap widget with output token set to address
4. Position widgets in optimal layout:
   - Chart: top-left, large (800x600)
   - Overview: top-right, medium (400x300)
   - Swap: bottom-right, medium (400x400)
5. Focus swap widget amount input
6. Animate widgets into position (300ms ease-out)

**Layout Algorithm**
```
Calculate available canvas space
Place chart at (viewport.centerX - 600, viewport.centerY - 400)
Place overview at (chart.right + 20, chart.top)
Place swap at (overview.left, overview.bottom + 20)
Ensure all widgets visible in viewport
```

### 9. Wallet Integration

**Wallet Adapter Setup**
- Use @solana/wallet-adapter-react
- Supported wallets: Phantom, Solflare, Backpack
- Auto-connect on load if previously connected
- Persist selected wallet to localStorage key: `wallet_provider`

**Wallet State Management**
```typescript
interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  wallet: Wallet | null;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
}
```

**Transaction Flow**
1. User initiates swap in Swap widget
2. Widget calls Jupiter SDK to get quote
3. User confirms swap
4. Widget calls Jupiter SDK to build transaction
5. Widget calls wallet.signTransaction()
6. Widget sends signed transaction to RPC
7. Widget polls for confirmation
8. Widget displays success/failure notification

### 10. Performance Optimizations

**Code Splitting**
- Lazy load widget components: `React.lazy(() => import('./widgets/SwapWidget'))`
- Lazy load translation files
- Lazy load heavy libraries (charting, drawing)

**Rendering Optimizations**
- Use React.memo for widget components
- Use useMemo for expensive calculations (risk scores, holder distributions)
- Use useCallback for event handlers
- Implement virtual scrolling for long lists (holder lists, transaction history)
- Debounce canvas pan/zoom updates (16ms)
- Throttle API calls (prevent spam)

**Caching Strategy**
- React Query cache: 30s for market data, 5min for static data
- localStorage cache: Workspace state, widget configs, annotations
- IndexedDB cache: Historical price data, large datasets
- Service Worker cache: Static assets, translation files

**Bundle Optimization**
- Tree shaking for unused code
- Minification and compression
- Dynamic imports for routes and widgets
- CDN for heavy dependencies (charting libraries)

## Data Models

### Core Data Models

**Widget Instance Model**
```typescript
interface WidgetInstance {
  id: string; // UUID v4
  type: WidgetType;
  position: Position;
  size: Size;
  zIndex: number;
  config: WidgetConfig;
  state: WidgetState;
  createdAt: number;
  updatedAt: number;
}

interface Position {
  x: number; // Canvas coordinates
  y: number;
}

interface Size {
  width: number; // Pixels
  height: number;
}

interface WidgetConfig {
  // Widget-specific configuration
  // Examples:
  // - Token address for analysis widgets
  // - RSS feed URL for feed widgets
  // - Slippage tolerance for swap widget
  [key: string]: any;
}

interface WidgetState {
  // Widget-specific runtime state
  // Examples:
  // - Notes content
  // - Checklist items
  // - PnL entries
  [key: string]: any;
}
```

**Workspace Model**
```typescript
interface Workspace {
  language: Language;
  widgets: WidgetInstance[];
  annotations: Annotation[];
  viewport: Viewport;
  zoom: number;
  pan: Position;
  version: number; // For migration compatibility
  lastModified: number;
}
```

**Token Data Models**
```typescript
interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  logoURI?: string;
}

interface TokenPair {
  pairAddress: string;
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  createdAt: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface HolderData {
  address: string;
  balance: number;
  percentage: number;
  rank: number;
}

interface LiquidityPool {
  address: string;
  locked: boolean;
  lockedPercentage: number;
  lockedUntil?: number;
  totalValue: number;
  providersCount: number;
}

interface RiskAssessment {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: RiskFlag[];
}

interface RiskFlag {
  type: 'low_lp' | 'high_concentration' | 'deployer_active' | 'new_token' | 'low_liquidity';
  severity: 'warning' | 'danger';
  message: string;
}
```

**Transaction Models**
```typescript
interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  priceImpact: number;
  minimumReceived: number;
  route: RouteInfo[];
  slippageBps: number;
}

interface RouteInfo {
  dex: string;
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
}

interface SwapResult {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  inputAmount: number;
  outputAmount: number;
  timestamp: number;
  error?: string;
}

interface PnLEntry {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  entryDate: number;
  exitDate?: number;
  pnl?: number;
  pnlPercentage?: number;
}
```

### Storage Schema

**localStorage Keys**
```
app_language: Language
app_wallet_provider: string
workspace_{language}: Workspace
tool_library_collapsed: boolean
widget_state_{widgetId}: WidgetState
```

**IndexedDB Schema**
```
Database: alpha_hunter_db
Version: 1

Object Stores:
1. price_history
   - keyPath: [tokenAddress, timestamp]
   - indexes: tokenAddress, timestamp
   - data: { tokenAddress, timestamp, price, volume }

2. cached_responses
   - keyPath: cacheKey
   - indexes: timestamp
   - data: { cacheKey, response, timestamp, expiresAt }

3. user_data
   - keyPath: key
   - data: { key, value, timestamp }
```

### API Response Models

**Birdeye API Responses**
```typescript
// GET /defi/v3/token/overview
interface BirdeyeTokenResponse {
  success: boolean;
  data: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    supply: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    mc: number;
    logoURI: string;
  };
}

// GET /defi/v3/pairs/new
interface BirdeyeNewPairsResponse {
  success: boolean;
  data: {
    items: Array<{
      address: string;
      baseToken: { address: string; symbol: string; name: string };
      quoteToken: { address: string; symbol: string; name: string };
      liquidity: number;
      volume24h: number;
      createdAt: number;
    }>;
  };
}

// GET /defi/v3/token/holder
interface BirdeyeHolderResponse {
  success: boolean;
  data: {
    items: Array<{
      address: string;
      balance: string;
      percentage: number;
    }>;
  };
}
```

**Jupiter API Models**
```typescript
// POST /quote
interface JupiterQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
}

interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RouteStep[];
}

interface RouteStep {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:
- Requirements 2.5 and 4.6 both test widget dragging (consolidated into Property 2)
- Requirements 2.6 and 4.7 both test widget resizing (consolidated into Property 3)
- Requirements 2.8 and 4.3 both test widget deletion (consolidated into Property 4)
- Requirements 1.3 and 1.4 form a round-trip property (consolidated into Property 1)
- Requirements 2.9 and 2.10 form a round-trip property (consolidated into Property 5)
- Multiple widget-specific requirements can be generalized into widget behavior properties

The following properties represent the unique, non-redundant correctness guarantees for the system.

### Core System Properties

**Property 1: Language Preference Persistence Round-Trip**
*For any* supported language selection, persisting the language to localStorage and then loading it on application startup should restore the same language preference.
**Validates: Requirements 1.3, 1.4**

**Property 2: Widget Position Updates**
*For any* widget instance and any valid canvas position, dragging the widget to that position should update the widget's stored position to match the target position.
**Validates: Requirements 2.5, 4.6**

**Property 3: Widget Size Updates**
*For any* widget instance and any valid size within the widget's constraints, resizing the widget should update the widget's stored dimensions to match the target size while respecting minimum size constraints.
**Validates: Requirements 2.6, 4.7, 4.8**

**Property 4: Widget Deletion**
*For any* widget instance on the canvas, deleting the widget should result in the widget no longer appearing in the workspace state and no longer being rendered on the canvas.
**Validates: Requirements 2.8, 4.3**

**Property 5: Workspace Persistence Round-Trip**
*For any* workspace configuration (widgets, positions, sizes, annotations), persisting the workspace to localStorage for a given language and then loading it should restore an equivalent workspace state.
**Validates: Requirements 2.9, 2.10**

**Property 6: Canvas Panning**
*For any* pan offset (x, y), applying the pan to the canvas should result in all widgets being visually offset by that amount relative to their original positions.
**Validates: Requirements 2.2**

**Property 7: Canvas Zooming**
*For any* zoom level between 0.1 and 5.0, applying the zoom should scale all widget positions and sizes proportionally while maintaining their relative positions.
**Validates: Requirements 2.3**

**Property 8: Widget Overlap Allowance**
*For any* two widget instances, positioning them such that their bounding boxes intersect should be allowed, and both widgets should remain fully interactive.
**Validates: Requirements 2.7**

### Internationalization Properties

**Property 9: Language Switch Completeness**
*For any* UI component containing translatable text, switching languages should result in all text being displayed in the target language using the translation keys.
**Validates: Requirements 1.2**

**Property 10: Translation Key Fallback**
*For any* translation key that does not exist in the translation map, the system should display the key identifier itself as the fallback text.
**Validates: Requirements 1.7**

### Widget System Properties

**Property 11: Widget Addition**
*For any* widget type in the tool library, clicking to add the widget should result in a new widget instance appearing on the canvas with the correct type and default configuration.
**Validates: Requirements 2.4, 3.4**

**Property 12: Widget Title Bar Controls**
*For any* widget instance, the widget should render with close, refresh, and duplicate controls that are functional and properly translated.
**Validates: Requirements 4.1, 4.2**

**Property 13: Widget Duplication**
*For any* widget instance with configuration, duplicating the widget should create a new widget instance with the same type and configuration but a different unique ID.
**Validates: Requirements 4.5**

**Property 14: Widget State Persistence**
*For any* widget instance with mutable state, modifying the state and persisting it should result in the state being retrievable from localStorage with the same values.
**Validates: Requirements 4.9**

**Property 15: Tool Library State Persistence**
*For any* tool library collapsed/expanded state, persisting the state to localStorage and reloading should restore the same collapsed/expanded state.
**Validates: Requirements 3.7**

### Discovery Widget Properties

**Property 16: New Token Highlighting**
*For any* token with creation timestamp less than 24 hours from current time, the token should be displayed with a visual highlight indicator in discovery widgets.
**Validates: Requirements 5.5, 13.1**

**Property 17: Volume Spike Detection**
*For any* token where (current_volume - avg_24h_volume) / avg_24h_volume > 1.0, the token should be highlighted with a volume spike indicator.
**Validates: Requirements 5.7, 13.2**

**Property 18: Holder Growth Detection**
*For any* token where (current_holders - holders_24h_ago) / holders_24h_ago exceeds the threshold, the token should be highlighted with a holder growth indicator.
**Validates: Requirements 13.3**

### Analysis Widget Properties

**Property 19: Risk Score Calculation**
*For any* token with LP percentage, holder concentration, and deployer activity data, the calculated risk score should equal: 
- base_score = 0
- if lp_percent < 50: base_score += (50 - lp_percent)
- if top10_percent > 50: base_score += (top10_percent - 50)
- if deployer_moved_24h: base_score += 30
**Validates: Requirements 14.1, 14.2, 14.3, 14.4**

**Property 20: Risk Level Categorization**
*For any* risk score value, the risk level should be categorized as: Low (0-30), Medium (31-60), High (61-80), or Critical (81+).
**Validates: Requirements 14.5**

**Property 21: Risk Flag Generation**
*For any* token analysis, if LP < 50%, a "Low LP" flag should be present; if top 10 holders > 50%, a "High Concentration" flag should be present; if deployer moved tokens in 24h, a "Deployer Active" flag should be present.
**Validates: Requirements 14.7**

### Execution Widget Properties

**Property 22: Quick Buy Amount Population**
*For any* quick buy button with preset SOL amount, clicking the button should populate the swap widget input amount field with exactly that SOL amount.
**Validates: Requirements 7.4**

**Property 23: Swap Quote Consistency**
*For any* valid swap parameters (input mint, output mint, amount, slippage), requesting a quote should return expected output amount, price impact, and minimum received values that are mathematically consistent with the input amount and slippage tolerance.
**Validates: Requirements 7.6, 7.7**

### Annotation Properties

**Property 24: Annotation Persistence**
*For any* set of annotations drawn on the canvas, persisting the annotations to localStorage and reloading should restore all annotations with the same positions, types, colors, and content.
**Validates: Requirements 10.6**

**Property 25: Annotation Language Agnostic**
*For any* set of annotations and any language switch, the annotations should remain unchanged and visible in the same positions.
**Validates: Requirements 10.7**

**Property 26: Annotation Visibility Toggle**
*For any* annotation layer state, toggling visibility should either show all annotations or hide all annotations without modifying the annotation data.
**Validates: Requirements 10.5**

### Fast Buy Flow Properties

**Property 27: Fast Buy Widget Creation**
*For any* token address, initiating fast buy should create exactly three widgets: a chart widget, a token overview widget, and a swap widget, all configured with the specified token address.
**Validates: Requirements 11.1, 11.2, 11.3**

**Property 28: Fast Buy Widget Configuration**
*For any* token address in fast buy flow, the swap widget should have the output token pre-populated with the token address and be ready for immediate interaction.
**Validates: Requirements 11.5**

### Wallet Integration Properties

**Property 29: Wallet State Sharing**
*For any* connected wallet, all widgets requiring wallet information should have access to the same wallet public key and connection state.
**Validates: Requirements 12.6**

**Property 30: Wallet Provider Persistence**
*For any* wallet provider selection, persisting the provider to localStorage and reloading should attempt to reconnect to the same wallet provider.
**Validates: Requirements 12.8, 12.9**

**Property 31: Wallet Disconnection Cleanup**
*For any* connected wallet, disconnecting should clear the wallet state from all widgets and update all wallet-dependent UI to the disconnected state.
**Validates: Requirements 12.7**

### Data Persistence Properties

**Property 32: Multi-Language Workspace Isolation**
*For any* two different language contexts, the workspace saved for language A should not affect the workspace for language B, and switching between languages should load the correct workspace for each language.
**Validates: Requirements 2.9, 17.2**

**Property 33: Widget State Isolation**
*For any* two widget instances of the same type, modifying the state of one widget should not affect the state of the other widget.
**Validates: Requirements 17.1**

**Property 34: Storage Error Recovery**
*For any* corrupted localStorage data, the system should detect the corruption, handle it gracefully without crashing, and reset to a valid default state.
**Validates: Requirements 17.7**

### Error Handling Properties

**Property 35: API Failure Graceful Degradation**
*For any* API request that fails, the system should display a user-friendly error message and provide a retry option without crashing the widget or application.
**Validates: Requirements 19.1, 19.3**

**Property 36: Transaction Failure Reporting**
*For any* wallet transaction that fails, the system should display the specific failure reason to the user and maintain the application in a consistent state.
**Validates: Requirements 19.2**

**Property 37: RPC Fallback**
*For any* primary RPC endpoint failure, the system should automatically attempt to use fallback RPC endpoints to complete the request.
**Validates: Requirements 19.4**

### Search and Navigation Properties

**Property 38: Token Search to Fast Buy**
*For any* token search result selection, selecting the result should initiate the fast buy flow with the correct token address.
**Validates: Requirements 16.6**

**Property 39: Top Bar Persistence**
*For any* canvas pan or zoom operation, the top bar should remain fixed at the top of the viewport and fully functional.
**Validates: Requirements 16.7**

### Utility Widget Properties

**Property 40: Notes Persistence**
*For any* notes widget content, modifying the content should persist the changes to localStorage, and reloading the widget should restore the exact content.
**Validates: Requirements 9.1, 9.5**

**Property 41: PnL Calculation Accuracy**
*For any* PnL tracker entry with entry price, exit price, and amount, the calculated PnL should equal (exit_price - entry_price) * amount.
**Validates: Requirements 9.7, 9.8**

**Property 42: Block Clock Real-Time Updates**
*For any* block clock widget, the displayed slot number should update approximately every 400ms to reflect the current Solana blockchain slot.
**Validates: Requirements 9.6**

## Error Handling

### Error Categories

**1. Network Errors**
- API request failures (timeout, 5xx errors, network unavailable)
- RPC endpoint failures
- Rate limiting errors

**Strategy:**
- Implement exponential backoff with max 3 retries
- Use fallback RPC endpoints (primary → fallback1 → fallback2)
- Display user-friendly error messages with retry button
- Cache last successful response for graceful degradation
- Log errors to console for debugging

**2. Wallet Errors**
- Wallet not installed
- User rejected connection
- Transaction rejected by user
- Insufficient balance
- Transaction simulation failed

**Strategy:**
- Detect wallet availability before showing connect button
- Display clear rejection messages ("User cancelled connection")
- Pre-validate balance before transaction
- Show simulation errors with explanation
- Provide links to install wallet extensions

**3. Data Validation Errors**
- Invalid token address format
- Missing required fields
- Out-of-range values (negative amounts, invalid slippage)

**Strategy:**
- Validate inputs on change with immediate feedback
- Use TypeScript for compile-time type checking
- Implement runtime validation with Zod schemas
- Display inline error messages near invalid fields
- Prevent form submission until valid

**4. Storage Errors**
- localStorage quota exceeded
- localStorage unavailable (private browsing)
- Corrupted data in storage
- IndexedDB errors

**Strategy:**
- Wrap storage operations in try-catch blocks
- Detect quota exceeded and offer to clear old data
- Validate data structure on load with schema validation
- Fall back to in-memory storage if localStorage unavailable
- Provide manual export/import for data backup

**5. Widget Errors**
- Widget component failed to load
- Widget data fetch failed
- Widget rendering error

**Strategy:**
- Wrap each widget in error boundary
- Display error state with retry button
- Log error details to console
- Allow closing broken widget
- Prevent error from affecting other widgets

**6. Performance Errors**
- Too many widgets causing lag
- Large datasets causing memory issues
- Slow API responses

**Strategy:**
- Limit maximum widgets per workspace (e.g., 20)
- Implement virtual scrolling for large lists
- Use pagination for large datasets
- Show loading states for slow operations
- Implement request cancellation for unmounted widgets

### Error Boundary Implementation

```typescript
class WidgetErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
    // Optional: Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={t('widget.error.generic')}
          onRetry={() => this.setState({ hasError: false, error: null })}
          onClose={() => this.props.onClose()}
        />
      );
    }
    return this.props.children;
  }
}
```

### Error Message Localization

All error messages must be translatable:
```typescript
const errorMessages = {
  'network.timeout': 'Request timed out. Please try again.',
  'wallet.not_installed': 'Wallet not found. Please install {walletName}.',
  'wallet.rejected': 'Connection rejected by user.',
  'transaction.insufficient_balance': 'Insufficient balance. Need {required} SOL.',
  'storage.quota_exceeded': 'Storage full. Clear old data?',
  'token.invalid_address': 'Invalid token address format.',
  'api.rate_limited': 'Too many requests. Please wait {seconds}s.',
};
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, null/undefined)
- Error conditions and error handling paths
- Integration points between components
- UI interactions and state changes

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must be maintained
- Round-trip properties (serialize/deserialize, save/load)
- Metamorphic properties (relationships between operations)

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Testing Tools and Configuration

**Unit Testing:**
- Framework: Vitest
- React Testing: React Testing Library
- Mocking: vi.mock() for API calls and external dependencies
- Coverage target: 80% line coverage

**Property-Based Testing:**
- Library: fast-check (JavaScript/TypeScript property testing)
- Configuration: Minimum 100 iterations per property test
- Generators: Custom generators for domain models (WidgetInstance, Position, TokenData)
- Shrinking: Enabled for minimal failing examples

**Test Organization:**
```
src/
  components/
    Widget/
      Widget.tsx
      Widget.test.tsx          # Unit tests
      Widget.properties.test.tsx  # Property tests
  stores/
    canvasStore.ts
    canvasStore.test.ts
    canvasStore.properties.test.ts
  utils/
    riskScore.ts
    riskScore.test.ts
    riskScore.properties.test.ts
```

### Property Test Tagging

Each property test must reference its design document property:

```typescript
import fc from 'fast-check';

describe('Canvas Store Properties', () => {
  it('Property 2: Widget Position Updates', () => {
    // Feature: alpha-hunter-crypto-workspace, Property 2: Widget Position Updates
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('swap', 'notes', 'chart'),
          position: fc.record({ x: fc.integer(), y: fc.integer() }),
          size: fc.record({ width: fc.integer(100, 1000), height: fc.integer(100, 800) }),
        }),
        fc.record({ x: fc.integer(), y: fc.integer() }),
        (widget, newPosition) => {
          const store = createCanvasStore();
          store.addWidget(widget.type, widget.position);
          const widgetId = store.widgets[0].id;
          
          store.updateWidget(widgetId, { position: newPosition });
          
          const updatedWidget = store.widgets.find(w => w.id === widgetId);
          expect(updatedWidget.position).toEqual(newPosition);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5: Workspace Persistence Round-Trip', () => {
    // Feature: alpha-hunter-crypto-workspace, Property 5: Workspace Persistence Round-Trip
    fc.assert(
      fc.property(
        fc.array(fc.record({
          type: fc.constantFrom('swap', 'notes', 'chart', 'token-overview'),
          position: fc.record({ x: fc.integer(-1000, 1000), y: fc.integer(-1000, 1000) }),
          size: fc.record({ width: fc.integer(200, 1000), height: fc.integer(200, 800) }),
        }), { minLength: 0, maxLength: 10 }),
        fc.constantFrom('en', 'zh-CN'),
        (widgets, language) => {
          const store = createCanvasStore();
          
          // Add widgets
          widgets.forEach(w => store.addWidget(w.type, w.position));
          
          // Save workspace
          store.saveWorkspace();
          
          // Create new store and load
          const newStore = createCanvasStore();
          newStore.loadWorkspace(language);
          
          // Verify equivalence
          expect(newStore.widgets.length).toBe(widgets.length);
          newStore.widgets.forEach((widget, i) => {
            expect(widget.type).toBe(widgets[i].type);
            expect(widget.position).toEqual(widgets[i].position);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Critical Test Areas

**1. Internationalization**
- Unit: Test specific translation keys exist
- Property: All UI components render with translated text for any language

**2. Canvas Operations**
- Unit: Test adding specific widget types
- Property: Any widget can be added, moved, resized, deleted

**3. Risk Scoring**
- Unit: Test specific risk scenarios (LP=30%, concentration=60%)
- Property: Risk score calculation is consistent for any token data

**4. Wallet Integration**
- Unit: Test Phantom wallet connection flow
- Property: Any supported wallet can connect and share state

**5. Data Persistence**
- Unit: Test saving specific workspace configuration
- Property: Any workspace configuration round-trips correctly

**6. Swap Execution**
- Unit: Test swap with 1 SOL → USDC
- Property: Quote calculations are mathematically consistent for any amounts

### Test Execution

**Development:**
```bash
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:property # Property tests only
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**CI/CD:**
- Run all tests on every pull request
- Require 80% coverage for merge
- Run property tests with 1000 iterations in CI (vs 100 locally)
- Fail build on any test failure

### Mock Data and Fixtures

**API Mocks:**
```typescript
// Mock Birdeye API responses
const mockTokenOverview = {
  address: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  price: 100.50,
  volume24h: 1000000,
  // ...
};

// Mock Jupiter quote response
const mockJupiterQuote = {
  inputMint: 'SOL',
  outputMint: 'USDC',
  inAmount: '1000000000',
  outAmount: '100000000',
  // ...
};
```

**Generators for Property Tests:**
```typescript
// Custom generators
const widgetTypeGen = fc.constantFrom(
  'swap', 'notes', 'chart', 'token-overview', 'holder-distribution'
);

const positionGen = fc.record({
  x: fc.integer(-5000, 5000),
  y: fc.integer(-5000, 5000),
});

const tokenAddressGen = fc.hexaString({ minLength: 32, maxLength: 44 });

const tokenDataGen = fc.record({
  address: tokenAddressGen,
  symbol: fc.string({ minLength: 2, maxLength: 10 }),
  price: fc.double({ min: 0.000001, max: 10000 }),
  lpPercent: fc.integer(0, 100),
  holderConcentration: fc.integer(0, 100),
});
```

### Performance Testing

While not part of automated tests, performance should be monitored:
- Lighthouse CI for bundle size and load time
- Manual testing with 20+ widgets for responsiveness
- Memory profiling for leak detection
- Network throttling tests for slow connections

### Accessibility Testing

- Automated: axe-core integration in unit tests
- Manual: Keyboard navigation testing
- Screen reader: NVDA/JAWS compatibility testing
- Color contrast: Automated checks in CI
