import { TopBar } from './components/TopBar';
import { ToolLibrary } from './components/ToolLibrary';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { WidgetContainer } from './components/WidgetContainer';
import { DynamicWidget } from './components/DynamicWidget';
import { useKeyboardShortcuts, getDefaultShortcuts } from './hooks/useKeyboardShortcuts';
import { useUIStore } from './stores/uiStore';
import { useCanvasStore } from './stores/canvasStore';

import { useEffect } from 'react';

function App() {
  const { toggleToolLibrary, theme } = useUIStore();
  const { setZoom, setPan, zoom, pan, widgets } = useCanvasStore();

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleTokenSelect = (tokenAddress: string) => {
    console.log('Token selected:', tokenAddress);
    // TODO: Implement Fast Buy flow when that feature is ready
  };

  // Register keyboard shortcuts
  const shortcuts = getDefaultShortcuts({
    onPanLeft: () => setPan({ x: pan.x + 50, y: pan.y }),
    onPanRight: () => setPan({ x: pan.x - 50, y: pan.y }),
    onPanUp: () => setPan({ x: pan.x, y: pan.y + 50 }),
    onPanDown: () => setPan({ x: pan.x, y: pan.y - 50 }),
    onZoomIn: () => setZoom(Math.min(zoom + 0.1, 5)),
    onZoomOut: () => setZoom(Math.max(zoom - 0.1, 0.1)),
    onToggleToolLibrary: () => toggleToolLibrary(),
  });

  useKeyboardShortcuts(shortcuts, true);

  return (
    <div className="h-screen w-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white overflow-hidden flex flex-col transition-colors duration-200">
      <TopBar onTokenSelect={handleTokenSelect} />

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <ToolLibrary />

        <InfiniteCanvas>
          {widgets.map((widget) => (
            <WidgetContainer key={widget.id} instance={widget}>
              <DynamicWidget instance={widget} />
            </WidgetContainer>
          ))}
        </InfiniteCanvas>
      </div>
    </div>
  );
}

export default App;
