# WidgetContainer Implementation Notes

## Overview

The WidgetContainer component is a critical piece of the Alpha Hunter Crypto Workspace, providing the foundation for the widget system. It wraps individual widget content with drag, resize, and control functionality.

## Architecture Decisions

### 1. Library Choices

**react-draggable**
- Chosen for its mature API and excellent performance
- Provides precise control over drag behavior
- Supports bounds checking and custom drag handles
- Well-maintained with TypeScript support

**react-resizable**
- Provides 8-point resize handles (corners + edges)
- Supports minimum/maximum size constraints
- Integrates well with react-draggable
- Customizable handle styling

**Alternative Considered**: Building custom drag/resize logic
- Rejected due to complexity and edge cases
- Libraries provide battle-tested solutions
- Better accessibility and touch support

### 2. State Management

**Local State**
- `isDragging`: Tracks drag state for cursor changes
- Minimal local state keeps component lightweight

**Store Integration**
- Direct integration with `useCanvasStore`
- Auto-save on position/size changes
- Debounced saves prevent excessive writes

**Props vs Store**
- Props allow custom handlers for flexibility
- Store provides default behavior
- Pattern: `onMove || updateWidget`

### 3. Styling Approach

**Inline Styles**
- Used for dynamic values (position, size, zIndex)
- Ensures correct rendering without CSS conflicts
- Better performance for frequently changing values

**CSS Classes**
- Used for static styling and animations
- Easier to maintain and override
- Better for hover effects and transitions

**Glassmorphism**
- Modern design trend for 2024
- Provides visual hierarchy
- Backdrop blur creates depth
- Semi-transparent backgrounds

### 4. Minimum Size Constraints

**Per-Widget-Type Constraints**
- Each widget type has specific minimum dimensions
- Ensures content remains usable
- Prevents widgets from becoming too small to interact with

**Implementation**
- Stored in `MIN_SIZES` constant
- Applied via ResizableBox `minConstraints` prop
- Enforced during resize operations

**Default Fallback**
- 250x150px for unknown widget types
- Reasonable minimum for most content

## Technical Details

### Drag Implementation

```typescript
<Draggable
  nodeRef={nodeRef}
  position={instance.position}
  onStart={handleDragStart}
  onStop={handleDragStop}
  handle=".widget-title-bar"
  bounds="parent"
>
```

**Key Points**:
- `nodeRef`: Prevents findDOMNode warnings in React 18
- `handle`: Only title bar is draggable
- `bounds`: Prevents dragging outside canvas
- `position`: Controlled component pattern

### Resize Implementation

```typescript
<ResizableBox
  width={instance.size.width}
  height={instance.size.height}
  minConstraints={[minSize.width, minSize.height]}
  onResizeStop={handleResizeStop}
  resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'e', 'w', 'n']}
>
```

**Key Points**:
- All 8 handles enabled for maximum flexibility
- `minConstraints`: Enforces minimum sizes
- `onResizeStop`: Only updates on completion (performance)
- Controlled component pattern

### Event Handlers

**Pattern**: Custom handler || Default store action

```typescript
const handleClose = useCallback(() => {
  if (onClose) {
    onClose(instance.id);
  } else {
    removeWidget(instance.id);
  }
}, [instance.id, onClose, removeWidget]);
```

**Benefits**:
- Flexibility for custom behavior
- Sensible defaults
- No prop drilling required

### Auto-Save Strategy

```typescript
setTimeout(() => {
  get().saveWorkspace();
}, 0);
```

**Why setTimeout(0)?**
- Defers save until after state update
- Prevents race conditions
- Batches multiple updates
- Non-blocking

**Future Enhancement**: Debounce for better performance
```typescript
const debouncedSave = debounce(() => {
  get().saveWorkspace();
}, 500);
```

## Performance Considerations

### 1. Render Optimization

**Current**:
- Component re-renders on any prop change
- Acceptable for current scale (< 20 widgets)

**Future Enhancement**:
```typescript
export const WidgetContainer = React.memo<WidgetContainerProps>(
  ({ instance, children, ...handlers }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison logic
    return (
      prevProps.instance.id === nextProps.instance.id &&
      prevProps.instance.position === nextProps.instance.position &&
      prevProps.instance.size === nextProps.instance.size
    );
  }
);
```

### 2. Event Handler Optimization

**Current**: All handlers use `useCallback`
- Prevents unnecessary re-renders
- Stable references for child components

### 3. CSS Performance

**Transitions**: Only on non-dragging state
```typescript
transition: isDragging ? 'none' : 'transform 0.1s ease-out'
```

**GPU Acceleration**: Using transforms
```typescript
transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
```

## Accessibility

### Current Implementation

1. **Keyboard Support**: Inherited from react-draggable
2. **Button Labels**: Title attributes on all buttons
3. **Semantic HTML**: Proper button elements
4. **Focus Management**: Native browser behavior

### Future Enhancements

1. **Keyboard Shortcuts**:
   - `Escape`: Close widget
   - `Ctrl+D`: Duplicate widget
   - `F5`: Refresh widget

2. **ARIA Labels**:
   ```typescript
   <button
     aria-label={t('widget.close', { name: widgetTitle })}
     onClick={handleClose}
   >
   ```

3. **Focus Trap**: Keep focus within widget when active

4. **Screen Reader Announcements**:
   ```typescript
   <div role="status" aria-live="polite">
     {t('widget.moved', { name: widgetTitle })}
   </div>
   ```

## Testing Strategy

### Unit Tests

**Coverage**:
- ✅ Rendering with title and content
- ✅ Control button functionality
- ✅ Event handler callbacks
- ✅ Styling and layout
- ✅ Minimum size constraints

**Mocking Strategy**:
- Mock `react-draggable`: Simplified wrapper
- Mock `react-resizable`: Simplified wrapper
- Mock `useCanvasStore`: Return mock functions

### Integration Tests (Future)

```typescript
it('integrates with canvas store', () => {
  const { result } = renderHook(() => useCanvasStore());
  
  render(
    <WidgetContainer instance={mockInstance}>
      <div>Content</div>
    </WidgetContainer>
  );
  
  // Drag widget
  // Verify store updated
  expect(result.current.widgets[0].position).toEqual(newPosition);
});
```

### Property-Based Tests (Future)

```typescript
it('Property: Widget position updates correctly', () => {
  fc.assert(
    fc.property(
      fc.record({
        x: fc.integer(-1000, 1000),
        y: fc.integer(-1000, 1000),
      }),
      (position) => {
        // Test that any position update works correctly
      }
    )
  );
});
```

## Known Limitations

### 1. Drag Bounds

**Current**: `bounds="parent"`
- Widgets can't be dragged outside canvas
- May be too restrictive for some use cases

**Future**: Custom bounds calculation
```typescript
const bounds = {
  left: -instance.size.width + 50,
  top: -instance.size.height + 50,
  right: canvasWidth - 50,
  bottom: canvasHeight - 50,
};
```

### 2. Z-Index Management

**Current**: Static z-index from instance
- No automatic "bring to front" on click

**Future**: Click to focus
```typescript
const handleClick = () => {
  const maxZ = Math.max(...widgets.map(w => w.zIndex));
  updateWidget(instance.id, { zIndex: maxZ + 1 });
};
```

### 3. Touch Support

**Current**: Basic touch support from libraries
- May not be optimal on tablets

**Future**: Enhanced touch gestures
- Pinch to resize
- Two-finger drag
- Long-press for context menu

### 4. Collision Detection

**Current**: None
- Widgets can overlap freely

**Future**: Optional snap-to-grid or collision avoidance
```typescript
const snapToGrid = (position: Position): Position => {
  const gridSize = 20;
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};
```

## Future Enhancements

### 1. Widget Snapping

- Snap to grid
- Snap to other widgets
- Alignment guides

### 2. Multi-Select

- Select multiple widgets
- Move/resize together
- Bulk operations

### 3. Context Menu

- Right-click menu
- Additional actions
- Widget-specific options

### 4. Animations

- Smooth transitions on add/remove
- Entrance/exit animations
- Attention-grabbing effects

### 5. Themes

- Light/dark mode support
- Custom color schemes
- User-defined styles

## Maintenance Notes

### Dependencies to Watch

1. **react-draggable**: Check for updates quarterly
2. **react-resizable**: Check for updates quarterly
3. **lucide-react**: Icons may change, verify compatibility

### Breaking Changes to Avoid

1. Don't change `WidgetInstance` interface without migration
2. Don't remove props without deprecation period
3. Don't change minimum size constraints without user notice

### Performance Monitoring

Watch for:
- Render count per drag operation
- Memory usage with 20+ widgets
- Frame rate during simultaneous drag/resize

## Related Components

- `InfiniteCanvas`: Parent container
- `DynamicWidget`: Child content loader
- `ToolLibrary`: Widget creation source

## References

- [react-draggable docs](https://github.com/react-grid-layout/react-draggable)
- [react-resizable docs](https://github.com/react-grid-layout/react-resizable)
- [Glassmorphism design](https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9)
