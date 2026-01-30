# DynamicWidget Component

## Overview

The `DynamicWidget` component is a core part of the Assistant Hunter Li Crypto Workspace system. It dynamically loads and renders widget components based on their type, implementing code splitting, error handling, and loading states.

## Features

- **Dynamic Loading**: Uses React.lazy to load widget components on-demand
- **Code Splitting**: Each widget type is loaded as a separate bundle
- **Error Isolation**: Wraps each widget in an ErrorBoundary to prevent crashes
- **Loading States**: Shows skeleton loader while widgets are loading
- **Type Safety**: Full TypeScript support with proper typing

## Requirements

This component satisfies the following requirements:
- **Requirement 4.10**: Dynamic widget injection
- **Requirement 19.3**: Widget error handling with error boundaries

## Usage

### Basic Usage

```tsx
import { DynamicWidget } from './components/DynamicWidget';
import type { WidgetInstance } from './types';

const widgetInstance: WidgetInstance = {
  id: 'widget-1',
  type: 'notes',
  position: { x: 100, y: 100 },
  size: { width: 400, height: 300 },
  zIndex: 1,
  config: {},
  state: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function App() {
  return <DynamicWidget instance={widgetInstance} />;
}
```

### With WidgetContainer

```tsx
import { DynamicWidget } from './components/DynamicWidget';
import { WidgetContainer } from './components/WidgetContainer';

function App() {
  return (
    <WidgetContainer instance={widgetInstance}>
      <DynamicWidget instance={widgetInstance} />
    </WidgetContainer>
  );
}
```

## Supported Widget Types

The DynamicWidget supports all widget types defined in the system:

### Discovery Widgets
- `dexscreener` - DexScreener chart embed
- `dextools` - DexTools chart embed
- `birdeye` - Birdeye token data
- `new-pairs` - Recently created token pairs
- `trending` - Trending tokens with volume spikes

### Analysis Widgets
- `token-overview` - Token metadata and overview
- `holder-distribution` - Token holder distribution chart
- `lp-overview` - Liquidity pool information
- `token-age` - Token creation date and age
- `deployer-info` - Token deployer information
- `risk-flags` - Risk assessment and warnings

### Execution Widgets
- `swap` - Token swap interface with Jupiter
- `quick-buy` - Quick buy with preset amounts

### Alpha Feed Widgets
- `twitter-embed` - Embedded tweets
- `telegram-channel` - Telegram channel messages
- `rss-feed` - RSS feed reader

### Utility Widgets
- `notes` - Rich text notes
- `checklist` - Task checklist
- `block-clock` - Solana block clock
- `pnl-tracker` - Profit and loss tracker

## Props

### DynamicWidgetProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| instance | WidgetInstance | Yes | The widget instance containing type, config, and state |

### WidgetInstance Type

```typescript
interface WidgetInstance {
  id: string;              // Unique widget identifier
  type: WidgetType;        // Widget type (e.g., 'notes', 'swap')
  position: Position;      // Canvas position { x, y }
  size: Size;              // Widget dimensions { width, height }
  zIndex: number;          // Stacking order
  config: Record<string, any>;  // Widget configuration
  state: Record<string, any>;   // Widget runtime state
  createdAt: number;       // Creation timestamp
  updatedAt: number;       // Last update timestamp
}
```

## Error Handling

The DynamicWidget component handles errors in three ways:

### 1. Unknown Widget Type

If a widget type is not registered, it displays an error message:

```
Unknown Widget Type
Widget type "xyz" is not registered
```

### 2. Widget Load Failure

If a widget component fails to load, the ErrorBoundary catches it and displays:
- Error icon
- Error message
- Retry button
- Close button

### 3. Widget Runtime Error

If a widget throws an error during rendering or execution, the ErrorBoundary isolates the error to that widget only, preventing the entire application from crashing.

## Loading States

While a widget is being loaded (code splitting), the component displays a `SkeletonLoader` with:
- Animated shimmer effect
- Multiple skeleton elements
- Smooth transitions

## Code Splitting

Each widget type is loaded as a separate bundle using React.lazy:

```typescript
const widgetComponents = {
  notes: lazy(() => import('../widgets/NotesWidget')),
  swap: lazy(() => import('../widgets/SwapWidget')),
  // ... other widgets
};
```

This reduces the initial bundle size and improves load times.

## Performance

- **Lazy Loading**: Widgets are only loaded when needed
- **Code Splitting**: Each widget is a separate bundle
- **Error Isolation**: Errors don't affect other widgets
- **Suspense**: Smooth loading transitions

## Testing

The component includes comprehensive tests:

```bash
npm test -- src/components/DynamicWidget.test.tsx
```

Tests cover:
- Skeleton loader display
- ErrorBoundary wrapping
- Unknown widget type handling
- All widget type support
- Code splitting verification

## Related Components

- **ErrorBoundary**: Catches and handles widget errors
- **SkeletonLoader**: Loading state placeholder
- **WidgetContainer**: Draggable/resizable container
- **Widget Components**: Individual widget implementations

## Architecture

```
DynamicWidget
├── ErrorBoundary (error isolation)
│   └── Suspense (loading state)
│       └── LazyWidget (dynamically loaded)
│           └── Widget Component (actual widget)
```

## Adding New Widget Types

To add a new widget type:

1. Create the widget component in `src/widgets/`:
```tsx
// src/widgets/MyNewWidget.tsx
import React from 'react';
import type { WidgetInstance } from '../types';

interface MyNewWidgetProps {
  instance: WidgetInstance;
}

const MyNewWidget: React.FC<MyNewWidgetProps> = ({ instance }) => {
  return <div>My New Widget</div>;
};

export default MyNewWidget;
```

2. Add the widget type to `src/types/index.ts`:
```typescript
export type WidgetType =
  | 'existing-types'
  | 'my-new-widget';  // Add here
```

3. Register in `DynamicWidget.tsx`:
```typescript
const widgetComponents = {
  // ... existing widgets
  'my-new-widget': lazy(() => import('../widgets/MyNewWidget')),
};
```

## Best Practices

1. **Always use with WidgetContainer** for full functionality
2. **Handle widget-specific errors** within the widget component
3. **Keep widget components small** for faster loading
4. **Use TypeScript** for type safety
5. **Test error states** to ensure proper error handling

## Troubleshooting

### Widget not loading
- Check that the widget type is registered in `widgetComponents`
- Verify the widget file exists in `src/widgets/`
- Check browser console for import errors

### Error boundary not catching errors
- Ensure errors are thrown during render, not in event handlers
- Use try-catch for async operations
- Check that ErrorBoundary is properly imported

### Skeleton loader not showing
- Widget may be loading too fast (cached)
- Check that Suspense is wrapping the lazy component
- Verify SkeletonLoader component is imported

## License

Part of the Alpha Hunter Crypto Workspace project.
