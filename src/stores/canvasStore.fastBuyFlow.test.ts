import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './canvasStore';

describe('CanvasStore - Fast Buy Flow', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useCanvasStore.getState();
    store.widgets.forEach((widget) => store.removeWidget(widget.id));
    localStorage.clear();
  });

  describe('fastBuyFlow', () => {
    it('should create three widgets with correct types', () => {
      const tokenAddress = 'So11111111111111111111111111111111111111112';

      const result = useCanvasStore.getState().fastBuyFlow(tokenAddress);
      const store = useCanvasStore.getState(); // Get fresh state after operation

      expect(result).not.toBeNull();
      expect(store.widgets).toHaveLength(3);

      // Find widgets by type
      const chartWidget = store.widgets.find((w) => w.type === 'dexscreener');
      const overviewWidget = store.widgets.find((w) => w.type === 'token-overview');
      const swapWidget = store.widgets.find((w) => w.type === 'swap');

      expect(chartWidget).toBeDefined();
      expect(overviewWidget).toBeDefined();
      expect(swapWidget).toBeDefined();
    });

    it('should configure widgets with token address', () => {
      const tokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

      useCanvasStore.getState().fastBuyFlow(tokenAddress);
      const store = useCanvasStore.getState();

      const chartWidget = store.widgets.find((w) => w.type === 'dexscreener');
      const overviewWidget = store.widgets.find((w) => w.type === 'token-overview');
      const swapWidget = store.widgets.find((w) => w.type === 'swap');

      // Chart and overview should have token address in config
      expect(chartWidget?.config.tokenAddress).toBe(tokenAddress);
      expect(overviewWidget?.config.tokenAddress).toBe(tokenAddress);

      // Swap should have token as output mint
      expect(swapWidget?.config.outputMint).toBe(tokenAddress);
      expect(swapWidget?.config.inputMint).toBe('So11111111111111111111111111111111111111112'); // SOL
    });

    it('should position widgets according to layout algorithm', () => {
      const tokenAddress = 'So11111111111111111111111111111111111111112';

      const result = useCanvasStore.getState().fastBuyFlow(tokenAddress);
      const store = useCanvasStore.getState();

      expect(result).not.toBeNull();
      if (!result) return;

      const chartWidget = store.widgets.find((w) => w.type === 'dexscreener');
      const overviewWidget = store.widgets.find((w) => w.type === 'token-overview');
      const swapWidget = store.widgets.find((w) => w.type === 'swap');

      // Verify positions match result
      expect(chartWidget?.position).toEqual(result.positions.chart);
      expect(overviewWidget?.position).toEqual(result.positions.overview);
      expect(swapWidget?.position).toEqual(result.positions.swap);

      // Verify layout relationships
      // Overview should be to the right of chart
      expect(overviewWidget!.position.x).toBeGreaterThan(chartWidget!.position.x);

      // Swap should be below overview
      expect(swapWidget!.position.y).toBeGreaterThan(overviewWidget!.position.y);

      // Swap and overview should have same x position
      expect(swapWidget!.position.x).toBe(overviewWidget!.position.x);
    });

    it('should set correct widget sizes', () => {
      const tokenAddress = 'So11111111111111111111111111111111111111112';

      useCanvasStore.getState().fastBuyFlow(tokenAddress);
      const store = useCanvasStore.getState();

      const chartWidget = store.widgets.find((w) => w.type === 'dexscreener');
      const overviewWidget = store.widgets.find((w) => w.type === 'token-overview');
      const swapWidget = store.widgets.find((w) => w.type === 'swap');

      // Chart should be large (800x600)
      expect(chartWidget?.size).toEqual({ width: 800, height: 600 });

      // Overview should be medium (400x300)
      expect(overviewWidget?.size).toEqual({ width: 400, height: 300 });

      // Swap should be medium (400x400)
      expect(swapWidget?.size).toEqual({ width: 400, height: 400 });
    });

    it('should assign increasing z-index values', () => {
      const tokenAddress = 'So11111111111111111111111111111111111111112';

      useCanvasStore.getState().fastBuyFlow(tokenAddress);
      const store = useCanvasStore.getState();

      const chartWidget = store.widgets.find((w) => w.type === 'dexscreener');
      const overviewWidget = store.widgets.find((w) => w.type === 'token-overview');
      const swapWidget = store.widgets.find((w) => w.type === 'swap');

      // Widgets should have increasing z-index
      expect(chartWidget!.zIndex).toBeLessThan(overviewWidget!.zIndex);
      expect(overviewWidget!.zIndex).toBeLessThan(swapWidget!.zIndex);
    });

    it('should return widget IDs and positions', () => {
      const tokenAddress = 'So11111111111111111111111111111111111111112';

      const result = useCanvasStore.getState().fastBuyFlow(tokenAddress);
      const store = useCanvasStore.getState();

      expect(result).not.toBeNull();
      if (!result) return;

      // Verify result structure
      expect(result).toHaveProperty('chartWidgetId');
      expect(result).toHaveProperty('overviewWidgetId');
      expect(result).toHaveProperty('swapWidgetId');
      expect(result).toHaveProperty('positions');

      // Verify IDs match actual widgets
      expect(store.widgets.find((w) => w.id === result.chartWidgetId)).toBeDefined();
      expect(store.widgets.find((w) => w.id === result.overviewWidgetId)).toBeDefined();
      expect(store.widgets.find((w) => w.id === result.swapWidgetId)).toBeDefined();
    });

    it('should reject invalid token addresses', () => {
      const invalidAddresses = [
        '',
        'invalid',
        '0x1234567890123456789012345678901234567890',
        'too-short',
      ];

      invalidAddresses.forEach((address) => {
        const result = useCanvasStore.getState().fastBuyFlow(address);
        expect(result).toBeNull();
      });

      // No widgets should be added
      const store = useCanvasStore.getState();
      expect(store.widgets).toHaveLength(0);
    });

    it('should work with custom viewport center', () => {
      const tokenAddress = 'So11111111111111111111111111111111111111112';
      const viewportCenter = { x: 2000, y: 1000 };

      const result = useCanvasStore.getState().fastBuyFlow(tokenAddress, viewportCenter);

      expect(result).not.toBeNull();
      if (!result) return;

      // Positions should be influenced by viewport center
      // Chart should be to the left of center
      expect(result.positions.chart.x).toBeLessThan(viewportCenter.x);
    });

    it('should maintain z-index when adding to existing widgets', () => {
      const store = useCanvasStore.getState();

      // Add some existing widgets
      store.addWidget('notes', { x: 0, y: 0 });
      store.addWidget('checklist', { x: 100, y: 100 });

      const existingMaxZIndex = Math.max(...useCanvasStore.getState().widgets.map((w) => w.zIndex));

      // Execute fast buy
      const tokenAddress = 'So11111111111111111111111111111111111111112';
      store.fastBuyFlow(tokenAddress);

      // New widgets should have higher z-index than existing
      const updatedStore = useCanvasStore.getState();
      const newWidgets = updatedStore.widgets.slice(-3); // Last 3 widgets
      newWidgets.forEach((widget) => {
        expect(widget.zIndex).toBeGreaterThan(existingMaxZIndex);
      });
    });

    it('should save workspace after adding widgets', () => {
      const tokenAddress = 'So11111111111111111111111111111111111111112';

      useCanvasStore.getState().fastBuyFlow(tokenAddress);

      // Wait for auto-save
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const saved = localStorage.getItem('workspace_en');
          expect(saved).not.toBeNull();

          const workspace = JSON.parse(saved!);
          expect(workspace.widgets).toHaveLength(3);
          resolve();
        }, 10);
      });
    });
  });
});
