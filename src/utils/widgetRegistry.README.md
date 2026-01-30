# Widget Registry

The Widget Registry is a centralized system for managing all available widgets in the Alpha Hunter Crypto Workspace. It provides a single source of truth for widget definitions, including their metadata, default configurations, and size constraints.

## Overview

The widget registry system consists of:
- **Widget Definitions**: Complete metadata for each widget type
- **Registry Map**: Central registry mapping widget types to their definitions
- **Utility Functions**: Helper functions for accessing and querying widget information

## Widget Definition Structure

Each widget in the registry has the following properties:

```typescript
interface WidgetDefinition {
  type: WidgetType;              // Unique identifier
  category: WidgetCategory;      // Organizational category
  icon: string;                  // Icon identifier (lucide-react)
  label: string;                 // Translation key for display name
  component: React.ComponentType; // Lazy-loaded React component
  defaultSize: Size;             // Default dimensions
  minSize: Size;                 // Minimum allowed dimensions
  maxSize?: Size;                // Maximum allowed dimensions (optional)
  defaultConfig: Record<string, any>; // Default configuration object
}
```

## Widget Categories

Widgets are organized into five categories:

1. **Discovery** - Token discovery and market exploration
   - DexScreener, DexTools, Birdeye, New Pairs, Trending Tokens

2. **Analysis** - Token analysis and risk assessment
   - Token Overview, Holder Distribution, LP Overview, Token Age, Deployer Info, Risk Flags

3. **Execution** - Trading and transaction execution
   - Swap, Quick Buy

4. **Alpha** - Real-time information feeds
   - Twitter Embed, Telegram Channel, RSS Feed

5. **Utilities** - Productivity and tracking tools
   - Notes, Checklist, Block Clock, PnL Tracker

## Usage

### Getting a Widget Definition

```typescript
import { getWidgetDefinition } from '@/utils/widgetRegistry';

const swapWidget = getWidgetDefinition('swap');
console.log(swapWidget.defaultSize); // { width: 400, height: 500 }
console.log(swapWidget.minSize);     // { width: 350, height: 400 }
```

### Getting Widgets by Category

```typescript
import { getWidgetsByCategory } from '@/utils/widgetRegistry';

const discoveryWidgets = getWidgetsByCategory('discovery');
// Returns array of 5 discovery widget definitions
```

### Getting All Categories

```typescript
import { getWidgetCategories } from '@/utils/widgetRegistry';

const categories = getWidgetCategories();
// Returns: ['discovery', 'analysis', 'execution', 'alpha', 'utilities']
```

### Validating Widget Types

```typescript
import { isValidWidgetType } from '@/utils/widgetRegistry';

if (isValidWidgetType('swap')) {
  // TypeScript knows this is a valid WidgetType
  const definition = getWidgetDefinition('swap');
}
```

### Accessing the Full Registry

```typescript
import { widgetRegistry } from '@/utils/widgetRegistry';

// Iterate over all widgets
Object.values(widgetRegistry).forEach((definition) => {
  console.log(`${definition.type}: ${definition.label}`);
});
```

## Widget Sizes

### Size Guidelines

- **Chart Widgets** (DexScreener, DexTools): Large default sizes (800x600+)
- **Analysis Widgets**: Medium sizes (400x300 to 500x400)
- **Utility Widgets**: Smaller sizes (300x200 to 400x400)
- **Feed Widgets**: Tall aspect ratios (400x600)

### Size Constraints

All widgets enforce:
- Minimum width: 200px+
- Minimum height: 100px+
- Default size ≥ minimum size
- Maximum size ≥ default size (when specified)

## Default Configurations

Each widget has sensible default configurations:

### Discovery Widgets
```typescript
{
  limit: 20,
  autoRefresh: true,
  refreshInterval: 30000 // 30 seconds
}
```

### Analysis Widgets
```typescript
{
  tokenAddress: '' // Empty, to be filled by user
}
```

### Execution Widgets
```typescript
{
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: '',
  slippageBps: 100 // 1% slippage
}
```

### Utility Widgets
```typescript
{
  content: '',    // Notes
  items: [],      // Checklist, PnL Tracker
  autoRefresh: true,
  refreshInterval: 400 // Block Clock
}
```

## Translation Keys

All widget labels use the format: `widgets.{widget-type}`

Examples:
- `widgets.swap` → "Swap" (EN) / "交换" (ZH)
- `widgets.token-overview` → "Token Overview" (EN) / "代币概览" (ZH)
- `widgets.pnl-tracker` → "PnL Tracker" (EN) / "盈亏追踪" (ZH)

Translation files are located in:
- `src/locales/en/widgets.json`
- `src/locales/zh-CN/widgets.json`

## Code Splitting

All widget components are lazy-loaded using `React.lazy()` for optimal bundle size:

```typescript
const SwapWidget = React.lazy(() => import('../widgets/SwapWidget'));
```

This ensures widgets are only loaded when they're actually added to the canvas.

## Adding a New Widget

To add a new widget to the registry:

1. **Create the widget component** in `src/widgets/`
2. **Add the widget type** to `WidgetType` in `src/types/index.ts`
3. **Import the component** in `widgetRegistry.tsx` using `React.lazy()`
4. **Add the definition** to the `widgetRegistry` object
5. **Add translation keys** to `src/locales/*/widgets.json`
6. **Update tests** to include the new widget type

Example:
```typescript
const MyNewWidget = React.lazy(() => import('../widgets/MyNewWidget'));

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  // ... existing widgets
  'my-new-widget': {
    type: 'my-new-widget',
    category: 'utilities',
    icon: 'Star',
    label: 'widgets.my-new-widget',
    component: MyNewWidget,
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    defaultConfig: {},
  },
};
```

## Testing

The widget registry includes comprehensive unit tests covering:
- All widget types are present
- Valid structure for each definition
- Correct categorization
- Size constraints
- Default configurations
- Utility functions
- Translation key format

Run tests:
```bash
npm test -- src/utils/widgetRegistry.test.ts
```

## Requirements Validation

This implementation satisfies **Requirement 3.2**:
> THE Tool_Library SHALL organize widgets into categories: Discovery, Analysis, Execution, Alpha Feeds, and Utilities

The registry provides:
- ✅ All 20 widget types defined
- ✅ 5 categories: discovery, analysis, execution, alpha, utilities
- ✅ Complete metadata for each widget
- ✅ Size constraints and defaults
- ✅ Translation keys for internationalization
- ✅ Lazy loading for performance
- ✅ Type-safe access with TypeScript
- ✅ Comprehensive test coverage
