import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { AnnotationLayer } from './AnnotationLayer';
import { AnnotationToolbar } from './AnnotationToolbar';

interface InfiniteCanvasProps {
  children?: React.ReactNode;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ children }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { zoom, pan, setZoom, setPan } = useCanvasStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle mouse wheel zoom (ctrl + wheel)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // Calculate zoom delta
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.max(0.1, Math.min(5.0, zoom + delta));

        setZoom(newZoom);
      }
    },
    [zoom, setZoom]
  );

  // Handle mouse down for panning (middle button or space + left button)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle button (button 1) or left button with space key
      if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan, isSpacePressed]
  );

  // Handle mouse move for panning
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const newPan = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };
        setPan(newPan);
      }
    },
    [isDragging, dragStart, setPan]
  );

  // Handle mouse up to stop panning
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle keyboard navigation (arrow keys for pan)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Track space key for pan mode
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // Arrow keys for panning
      const panStep = 50; // pixels to pan per key press
      let newPan = { ...pan };

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newPan.y += panStep;
          break;
        case 'ArrowDown':
          e.preventDefault();
          newPan.y -= panStep;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newPan.x += panStep;
          break;
        case 'ArrowRight':
          e.preventDefault();
          newPan.x -= panStep;
          break;
        default:
          return;
      }

      setPan(newPan);
    },
    [pan, setPan, isSpacePressed]
  );

  // Handle key up to release space key
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      setIsSpacePressed(false);
      setIsDragging(false);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add wheel event listener with passive: false to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Add keyboard event listeners to window
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Update canvas size on resize
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleWheel, handleKeyDown, handleKeyUp]);

  // Update cursor based on pan mode
  const cursor = isDragging
    ? 'grabbing'
    : isSpacePressed || isDragging
      ? 'grab'
      : 'default';

  return (
    <div
      ref={canvasRef}
      className="infinite-canvas"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas viewport with transform applied */}
      <div
        className="canvas-viewport"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>

      {/* Annotation Layer */}
      <AnnotationLayer width={canvasSize.width} height={canvasSize.height} />

      {/* Annotation Toolbar */}
      <AnnotationToolbar />
    </div>
  );
};
