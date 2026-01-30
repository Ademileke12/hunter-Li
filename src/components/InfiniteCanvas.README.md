# InfiniteCanvas Component

A high-performance infinite canvas component with pan and zoom controls for the Alpha Hunter Crypto Workspace.

## Features

- ✅ **Infinite Panning**: Pan in any direction without boundaries
- ✅ **Smooth Zooming**: Zoom from 0.1x to 5.0x with Ctrl+Wheel
- ✅ **Multiple Pan Methods**: Middle button drag, Space+drag, or arrow keys
- ✅ **CSS Transforms**: Hardware-accelerated rendering for smooth performance
- ✅ **State Management**: Integrated with Zustand canvas store
- ✅ **Keyboard Navigation**: Full keyboard support for accessibility
- ✅ **Visual Feedback**: Dynamic cursor states (default, grab, grabbing)

## Usage

```tsx
import { InfiniteCanvas } from './components/InfiniteCanvas';

function App() {
  return (
    <InfiniteCanvas>
      {/* Your canvas content here */}
      <div style={{ position: 'absolute', left: 100, top: 100 }}>
        Widget 1
      </div>
      <div style={{ position: 'absolute', left: 300, top: 200 }}>
        Widget 2
      </div>
    </InfiniteCanvas>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | No | Content to render inside the canvas viewport |

## Controls

### Panning

1. **Middle Mouse Button**: Click and drag with the middle mouse button
2. **Space + Drag**: Hold Space key and drag with left mouse button
3. **Arrow Keys**: Use ↑ ↓ ← → keys to pan (50px per press)

### Zooming

- **Ctrl + Mouse Wheel**: Zoom in/out (Cmd + Wheel on Mac)
  - Scroll up: Zoom in
  - Scroll down: Zoom out
  - Zoom range: 0.1x to 5.0x

## State Management

The component integrates with the canvas store:

```tsx
import { useCanvasStore } from '../stores/canvasStore';

const { zoom, pan, setZoom, setPan } = useCanvasStore();
```

### State Properties

- `zoom`: Current zoom level (0.1 - 5.0)
- `pan`: Current pan offset `{ x: number, y: number }`
- `setZoom(zoom: number)`: Update zoom level
- `setPan(pan: Position)`: Update pan offset

## Styling

The canvas applies the following styles:

- **Background**: Dark theme (`#0a0a0f`)
- **Transform Origin**: Top-left (0, 0)
- **Transitions**: Smooth 0.1s ease-out (disabled while dragging)
- **Cursor States**:
  - `default`: Normal state
  - `grab`: Space key pressed or hovering in pan mode
  - `grabbing`: Actively dragging

## Performance

- Uses CSS transforms for hardware acceleration
- Disables transitions during drag for smooth 60fps performance
- Debounced state updates to prevent excessive re-renders
- Viewport culling ready (widgets outside viewport can be hidden)

## Accessibility

- Full keyboard navigation support
- Arrow keys for panning
- Space key for pan mode activation
- Semantic HTML structure

## Requirements Validated

This component validates the following requirements:

- **Requirement 2.2**: Canvas allows panning in any direction
- **Requirement 2.3**: Canvas allows zooming in and out

## Testing

The component includes comprehensive unit tests covering:

- Rendering and children
- Mouse wheel zoom (Ctrl+Wheel)
- Middle button drag panning
- Space + drag panning
- Keyboard navigation (arrow keys)
- Cursor states
- CSS transforms
- Edge cases and error handling

Run tests:

```bash
npm test -- src/components/InfiniteCanvas.test.tsx
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ⚠️ Touch events not yet implemented

## Future Enhancements

- [ ] Touch gesture support (pinch to zoom, two-finger pan)
- [ ] Minimap for navigation
- [ ] Viewport culling for performance
- [ ] Zoom to fit functionality
- [ ] Reset view button
- [ ] Configurable pan/zoom limits

## Related Components

- `WidgetContainer`: Draggable/resizable widget wrapper
- `AnnotationLayer`: Drawing overlay for canvas
- `ToolLibrary`: Widget selection sidebar

## License

Part of the Alpha Hunter Crypto Workspace project.
