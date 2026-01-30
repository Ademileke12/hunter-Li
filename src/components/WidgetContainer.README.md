# WidgetContainer Component

A draggable and resizable container component for widgets with glassmorphism styling, designed for the Alpha Hunter Crypto Workspace.

## Features

- **Draggable**: Drag widgets by their title bar to reposition them on the canvas
- **Resizable**: Resize widgets using handles on all edges and corners
- **Minimum Size Constraints**: Enforces minimum dimensions per widget type
- **Control Buttons**: Close, refresh, and duplicate buttons in the title bar
- **Glassmorphism Styling**: Modern frosted glass effect with backdrop blur
- **Internationalization**: All UI text is translatable
- **Auto-save**: Automatically persists changes to the canvas store

## Usage

### Basic Usage

```tsx
import { WidgetContainer } from './components/WidgetContainer';
import type { WidgetInstance } from './types';

const myWidget: WidgetInstance = {
  id: 'widget-1',
  type: 'notes',
  position: { x: 100, y: 100 },
  size: { width: 400, height: 300 },
  zIndex: 1,
  config: { title: 'My Notes' },
  state: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

<WidgetContainer instance={myWidget}>
  <div>Your widget content here</div>
</WidgetContainer>
```

### With Custom Event Handlers

```tsx
<WidgetContainer
  instance={myWidget}
  onMove={(id, position) => console.log('Moved:', id, position)}
  onResize={(id, size) => console.log('Resized:', id, size)}
  onClose={(id) => console.log('Closed:', id)}
  onRefresh={(id) => console.log('Refreshed:', id)}
  onDuplicate={(id) => console.log('Duplicated:', id)}
>
  <div>Your widget content here</div>
</WidgetContainer>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `instance` | `WidgetInstance` | Yes | The widget instance data including position, size, type, etc. |
| `children` | `React.ReactNode` | Yes | The content to render inside the widget |
| `onMove` | `(id: string, position: Position) => void` | No | Callback when widget is moved. If not provided, uses store's `updateWidget` |
| `onResize` | `(id: string, size: Size) => void` | No | Callback when widget is resized. If not provided, uses store's `updateWidget` |
| `onClose` | `(id: string) => void` | No | Callback when close button is clicked. If not provided, uses store's `removeWidget` |
| `onRefresh` | `(id: string) => void` | No | Callback when refresh button is clicked |
| `onDuplicate` | `(id: string) => void` | No | Callback when duplicate button is clicked. If not provided, uses store's `duplicateWidget` |

## Minimum Size Constraints

The component enforces minimum size constraints per widget type to ensure usability:

| Widget Type | Min Width | Min Height |
|-------------|-----------|------------|
| `dexscreener` | 400px | 300px |
| `dextools` | 400px | 300px |
| `birdeye` | 300px | 200px |
| `new-pairs` | 400px | 300px |
| `trending` | 400px | 300px |
| `token-overview` | 300px | 200px |
| `holder-distribution` | 300px | 250px |
| `lp-overview` | 300px | 200px |
| `token-age` | 250px | 150px |
| `deployer-info` | 300px | 200px |
| `risk-flags` | 300px | 250px |
| `swap` | 350px | 400px |
| `quick-buy` | 350px | 350px |
| `twitter-embed` | 350px | 400px |
| `telegram-channel` | 350px | 400px |
| `rss-feed` | 400px | 300px |
| `notes` | 300px | 200px |
| `checklist` | 300px | 250px |
| `block-clock` | 250px | 150px |
| `pnl-tracker` | 400px | 300px |
| Default | 250px | 150px |

## Styling

The component uses inline styles for core functionality and CSS classes for enhanced styling:

### CSS Classes

- `.widget-container` - The outer draggable container
- `.widget-resizable` - The resizable wrapper
- `.widget-content-wrapper` - The main content wrapper with glassmorphism
- `.widget-title-bar` - The draggable title bar
- `.widget-control-btn` - Control buttons (close, refresh, duplicate)
- `.widget-content` - The scrollable content area

### Glassmorphism Effect

The component applies a modern glassmorphism effect:
- Semi-transparent background: `rgba(15, 15, 25, 0.85)`
- Backdrop blur: `blur(12px)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Box shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`

## Interactions

### Dragging
- Click and hold the title bar to drag the widget
- The cursor changes to `grab` when hovering over the title bar
- The cursor changes to `grabbing` while dragging

### Resizing
- Hover over edges or corners to see resize handles
- Handles appear on all 8 positions: N, S, E, W, NE, NW, SE, SW
- Resize handles show a blue indicator on hover
- Minimum size constraints are enforced during resize

### Control Buttons
- **Refresh**: Reloads widget data (icon: RefreshCw)
- **Duplicate**: Creates a copy of the widget (icon: Copy)
- **Close**: Removes the widget from the canvas (icon: X)

All buttons have hover effects:
- Refresh/Duplicate: Blue highlight on hover
- Close: Red highlight on hover

## Integration with Canvas Store

The component integrates with the Zustand canvas store:

```typescript
import { useCanvasStore } from '../stores/canvasStore';

// Inside component:
const { updateWidget, removeWidget, duplicateWidget } = useCanvasStore();
```

When custom handlers are not provided, the component automatically:
- Updates widget position/size in the store
- Removes widgets from the store
- Duplicates widgets in the store
- Auto-saves changes to localStorage

## Accessibility

- All control buttons have `title` attributes for tooltips
- Semantic HTML structure
- Keyboard-accessible controls
- Screen reader friendly

## Performance

- Uses `React.memo` internally for optimized re-renders
- Debounced auto-save to prevent excessive localStorage writes
- Smooth CSS transitions for visual feedback
- Efficient event handlers with `useCallback`

## Dependencies

- `react-draggable`: For drag functionality
- `react-resizable`: For resize functionality
- `lucide-react`: For icons (X, RefreshCw, Copy)
- `zustand`: For state management

## Browser Support

- Modern browsers with CSS backdrop-filter support
- Fallback styling for browsers without backdrop-filter
- Tested on Chrome, Firefox, Safari, Edge

## Example

See `WidgetContainer.example.tsx` for a complete working example.

## Testing

Run tests with:
```bash
npm test -- src/components/WidgetContainer.test.tsx
```

The test suite covers:
- Rendering with title and content
- Control button functionality
- Event handler callbacks
- Styling and layout
- Minimum size constraints
