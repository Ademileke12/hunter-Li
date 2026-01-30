import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InfiniteCanvas } from './InfiniteCanvas';
import { useCanvasStore } from '../stores/canvasStore';

// Mock the canvas store
vi.mock('../stores/canvasStore');

describe('InfiniteCanvas', () => {
  let mockSetZoom: ReturnType<typeof vi.fn>;
  let mockSetPan: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetZoom = vi.fn();
    mockSetPan = vi.fn();

    // Setup mock store
    (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      zoom: 1,
      pan: { x: 0, y: 0 },
      setZoom: mockSetZoom,
      setPan: mockSetPan,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render canvas container', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render children inside viewport', () => {
      render(
        <InfiniteCanvas>
          <div data-testid="child-element">Test Child</div>
        </InfiniteCanvas>
      );
      expect(screen.getByTestId('child-element')).toBeTruthy();
    });

    it('should apply initial transform based on zoom and pan', () => {
      (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        zoom: 1.5,
        pan: { x: 100, y: 50 },
        setZoom: mockSetZoom,
        setPan: mockSetPan,
      });

      const { container } = render(<InfiniteCanvas />);
      const viewport = container.querySelector('.canvas-viewport') as HTMLElement;
      
      expect(viewport.style.transform).toContain('translate(100px, 50px)');
      expect(viewport.style.transform).toContain('scale(1.5)');
    });
  });

  describe('Mouse Wheel Zoom (Ctrl + Wheel)', () => {
    it('should zoom in when ctrl+wheel scrolls up', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      fireEvent.wheel(canvas, {
        deltaY: -100,
        ctrlKey: true,
      });

      expect(mockSetZoom).toHaveBeenCalled();
      const zoomValue = mockSetZoom.mock.calls[0][0];
      expect(zoomValue).toBeGreaterThan(1);
    });

    it('should zoom out when ctrl+wheel scrolls down', () => {
      (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        zoom: 2,
        pan: { x: 0, y: 0 },
        setZoom: mockSetZoom,
        setPan: mockSetPan,
      });

      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      fireEvent.wheel(canvas, {
        deltaY: 100,
        ctrlKey: true,
      });

      expect(mockSetZoom).toHaveBeenCalled();
      const zoomValue = mockSetZoom.mock.calls[0][0];
      expect(zoomValue).toBeLessThan(2);
    });

    it('should not zoom without ctrl key', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      fireEvent.wheel(canvas, {
        deltaY: -100,
        ctrlKey: false,
      });

      expect(mockSetZoom).not.toHaveBeenCalled();
    });

    it('should clamp zoom to minimum 0.1', () => {
      (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        zoom: 0.1,
        pan: { x: 0, y: 0 },
        setZoom: mockSetZoom,
        setPan: mockSetPan,
      });

      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Try to zoom out beyond minimum
      fireEvent.wheel(canvas, {
        deltaY: 1000,
        ctrlKey: true,
      });

      expect(mockSetZoom).toHaveBeenCalled();
      const zoomValue = mockSetZoom.mock.calls[0][0];
      expect(zoomValue).toBeGreaterThanOrEqual(0.1);
    });

    it('should clamp zoom to maximum 5.0', () => {
      (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        zoom: 5.0,
        pan: { x: 0, y: 0 },
        setZoom: mockSetZoom,
        setPan: mockSetPan,
      });

      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Try to zoom in beyond maximum
      fireEvent.wheel(canvas, {
        deltaY: -1000,
        ctrlKey: true,
      });

      expect(mockSetZoom).toHaveBeenCalled();
      const zoomValue = mockSetZoom.mock.calls[0][0];
      expect(zoomValue).toBeLessThanOrEqual(5.0);
    });
  });

  describe('Mouse Drag Panning (Middle Button)', () => {
    it('should pan when dragging with middle mouse button', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Start drag with middle button (button 1)
      fireEvent.mouseDown(canvas, {
        button: 1,
        clientX: 100,
        clientY: 100,
      });

      // Move mouse
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 150,
      });

      expect(mockSetPan).toHaveBeenCalled();
      const panValue = mockSetPan.mock.calls[0][0];
      // Pan delta should be 50 (150 - 100)
      expect(panValue.x).toBe(50);
      expect(panValue.y).toBe(50);
    });

    it('should stop panning on mouse up', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Start drag
      fireEvent.mouseDown(canvas, {
        button: 1,
        clientX: 100,
        clientY: 100,
      });

      // Move mouse
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 150,
      });

      expect(mockSetPan).toHaveBeenCalledTimes(1);

      // Release mouse
      fireEvent.mouseUp(canvas);

      // Move again - should not pan
      mockSetPan.mockClear();
      fireEvent.mouseMove(canvas, {
        clientX: 200,
        clientY: 200,
      });

      expect(mockSetPan).not.toHaveBeenCalled();
    });

    it('should stop panning when mouse leaves canvas', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Start drag
      fireEvent.mouseDown(canvas, {
        button: 1,
        clientX: 100,
        clientY: 100,
      });

      // Mouse leaves
      fireEvent.mouseLeave(canvas);

      // Move again - should not pan
      mockSetPan.mockClear();
      fireEvent.mouseMove(canvas, {
        clientX: 200,
        clientY: 200,
      });

      expect(mockSetPan).not.toHaveBeenCalled();
    });
  });

  describe('Space + Drag Panning', () => {
    it('should pan when dragging with space + left mouse button', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Press space key
      fireEvent.keyDown(window, { code: 'Space' });

      // Start drag with left button (button 0)
      fireEvent.mouseDown(canvas, {
        button: 0,
        clientX: 100,
        clientY: 100,
      });

      // Move mouse
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 150,
      });

      expect(mockSetPan).toHaveBeenCalled();
    });

    it('should not pan with left button without space key', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Start drag with left button without space
      fireEvent.mouseDown(canvas, {
        button: 0,
        clientX: 100,
        clientY: 100,
      });

      // Move mouse
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 150,
      });

      expect(mockSetPan).not.toHaveBeenCalled();
    });

    it('should stop panning when space key is released', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Press space and start drag
      fireEvent.keyDown(window, { code: 'Space' });
      fireEvent.mouseDown(canvas, {
        button: 0,
        clientX: 100,
        clientY: 100,
      });

      // Release space key
      fireEvent.keyUp(window, { code: 'Space' });

      // Move mouse - should not pan
      mockSetPan.mockClear();
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 150,
      });

      expect(mockSetPan).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation (Arrow Keys)', () => {
    it('should pan up when arrow up is pressed', () => {
      render(<InfiniteCanvas />);

      fireEvent.keyDown(window, { key: 'ArrowUp' });

      expect(mockSetPan).toHaveBeenCalled();
      const panValue = mockSetPan.mock.calls[0][0];
      expect(panValue.y).toBeGreaterThan(0);
    });

    it('should pan down when arrow down is pressed', () => {
      render(<InfiniteCanvas />);

      fireEvent.keyDown(window, { key: 'ArrowDown' });

      expect(mockSetPan).toHaveBeenCalled();
      const panValue = mockSetPan.mock.calls[0][0];
      expect(panValue.y).toBeLessThan(0);
    });

    it('should pan left when arrow left is pressed', () => {
      render(<InfiniteCanvas />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(mockSetPan).toHaveBeenCalled();
      const panValue = mockSetPan.mock.calls[0][0];
      expect(panValue.x).toBeGreaterThan(0);
    });

    it('should pan right when arrow right is pressed', () => {
      render(<InfiniteCanvas />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(mockSetPan).toHaveBeenCalled();
      const panValue = mockSetPan.mock.calls[0][0];
      expect(panValue.x).toBeLessThan(0);
    });

    it('should pan by consistent step size', () => {
      (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        zoom: 1,
        pan: { x: 0, y: 0 },
        setZoom: mockSetZoom,
        setPan: mockSetPan,
      });

      render(<InfiniteCanvas />);

      fireEvent.keyDown(window, { key: 'ArrowUp' });
      const firstPan = mockSetPan.mock.calls[0][0];

      mockSetPan.mockClear();
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      const secondPan = mockSetPan.mock.calls[0][0];

      // Both should pan by the same amount (50px)
      expect(firstPan.y).toBe(50);
      expect(secondPan.y).toBe(50);
    });
  });

  describe('Cursor States', () => {
    it('should show default cursor initially', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;
      
      expect(canvas.style.cursor).toBe('default');
    });

    it('should show grab cursor when space is pressed', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      fireEvent.keyDown(window, { code: 'Space' });

      // Re-render to see cursor change
      expect(canvas.style.cursor).toBe('grab');
    });

    it('should show grabbing cursor when dragging', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      fireEvent.mouseDown(canvas, {
        button: 1,
        clientX: 100,
        clientY: 100,
      });

      expect(canvas.style.cursor).toBe('grabbing');
    });
  });

  describe('CSS Transforms', () => {
    it('should apply smooth transition when not dragging', () => {
      const { container } = render(<InfiniteCanvas />);
      const viewport = container.querySelector('.canvas-viewport') as HTMLElement;

      expect(viewport.style.transition).toContain('transform');
      expect(viewport.style.transition).toContain('ease-out');
    });

    it('should disable transition while dragging', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;
      const viewport = container.querySelector('.canvas-viewport') as HTMLElement;

      // Start dragging
      fireEvent.mouseDown(canvas, {
        button: 1,
        clientX: 100,
        clientY: 100,
      });

      expect(viewport.style.transition).toBe('none');
    });

    it('should set transform origin to top-left', () => {
      const { container } = render(<InfiniteCanvas />);
      const viewport = container.querySelector('.canvas-viewport') as HTMLElement;

      expect(viewport.style.transformOrigin).toBe('0 0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid zoom changes', () => {
      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      // Rapid zoom in
      for (let i = 0; i < 10; i++) {
        fireEvent.wheel(canvas, {
          deltaY: -100,
          ctrlKey: true,
        });
      }

      expect(mockSetZoom).toHaveBeenCalled();
      // Should still be within bounds
      const lastZoom = mockSetZoom.mock.calls[mockSetZoom.mock.calls.length - 1][0];
      expect(lastZoom).toBeLessThanOrEqual(5.0);
    });

    it('should handle pan with existing offset', () => {
      (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        zoom: 1,
        pan: { x: 100, y: 50 },
        setZoom: mockSetZoom,
        setPan: mockSetPan,
      });

      const { container } = render(<InfiniteCanvas />);
      const canvas = container.querySelector('.infinite-canvas') as HTMLElement;

      fireEvent.mouseDown(canvas, {
        button: 1,
        clientX: 200,
        clientY: 150,
      });

      fireEvent.mouseMove(canvas, {
        clientX: 250,
        clientY: 200,
      });

      expect(mockSetPan).toHaveBeenCalled();
      const panValue = mockSetPan.mock.calls[0][0];
      // New pan should be clientX - dragStart.x
      // dragStart.x = 200 - 100 = 100
      // newPan.x = 250 - 100 = 150
      // dragStart.y = 150 - 50 = 100
      // newPan.y = 200 - 100 = 100
      expect(panValue.x).toBe(150);
      expect(panValue.y).toBe(100);
    });

    it('should handle multiple simultaneous key presses', () => {
      render(<InfiniteCanvas />);

      // Press multiple arrow keys
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      // Should have called setPan twice
      expect(mockSetPan).toHaveBeenCalledTimes(2);
    });
  });
});
