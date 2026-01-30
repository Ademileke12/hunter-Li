import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Arrow, Rect, Text as KonvaText } from 'react-konva';
import { useCanvasStore } from '../stores/canvasStore';
import { useUIStore } from '../stores/uiStore';
import type { Annotation, DrawingTool } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AnnotationLayerProps {
  width: number;
  height: number;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ width, height }) => {
  const { annotations, addAnnotation, removeAnnotation, zoom, pan } = useCanvasStore();
  const { annotationMode, selectedTool } = useUIStore();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const stageRef = useRef<any>(null);

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback(
    (e: any) => {
      if (!annotationMode || !selectedTool) return;

      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      
      // Adjust for canvas pan and zoom
      const adjustedX = (pointerPos.x - pan.x) / zoom;
      const adjustedY = (pointerPos.y - pan.y) / zoom;

      setIsDrawing(true);

      const baseAnnotation = {
        id: uuidv4(),
        color: '#00d4ff', // Neon blue
        strokeWidth: 2,
        timestamp: Date.now(),
      };

      switch (selectedTool) {
        case 'pencil':
          setCurrentAnnotation({
            ...baseAnnotation,
            type: 'pencil',
            points: [adjustedX, adjustedY],
          });
          break;
        case 'arrow':
          setCurrentAnnotation({
            ...baseAnnotation,
            type: 'arrow',
            points: [adjustedX, adjustedY, adjustedX, adjustedY],
          });
          break;
        case 'highlight':
          setCurrentAnnotation({
            ...baseAnnotation,
            type: 'highlight',
            rect: { x: adjustedX, y: adjustedY, width: 0, height: 0 },
          });
          break;
        case 'text':
          // For text, we'll prompt for input
          const text = prompt('Enter text:');
          if (text) {
            const textAnnotation: Annotation = {
              ...baseAnnotation,
              type: 'text',
              text,
              position: { x: adjustedX, y: adjustedY },
            };
            addAnnotation(textAnnotation);
          }
          break;
      }
    },
    [annotationMode, selectedTool, addAnnotation, zoom, pan]
  );

  // Handle mouse move - continue drawing
  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || !currentAnnotation) return;

      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      
      // Adjust for canvas pan and zoom
      const adjustedX = (pointerPos.x - pan.x) / zoom;
      const adjustedY = (pointerPos.y - pan.y) / zoom;

      switch (currentAnnotation.type) {
        case 'pencil':
          if (currentAnnotation.points) {
            setCurrentAnnotation({
              ...currentAnnotation,
              points: [...currentAnnotation.points, adjustedX, adjustedY],
            });
          }
          break;
        case 'arrow':
          if (currentAnnotation.points && currentAnnotation.points.length >= 2) {
            setCurrentAnnotation({
              ...currentAnnotation,
              points: [
                currentAnnotation.points[0],
                currentAnnotation.points[1],
                adjustedX,
                adjustedY,
              ],
            });
          }
          break;
        case 'highlight':
          if (currentAnnotation.rect) {
            const startX = currentAnnotation.rect.x;
            const startY = currentAnnotation.rect.y;
            setCurrentAnnotation({
              ...currentAnnotation,
              rect: {
                x: Math.min(startX, adjustedX),
                y: Math.min(startY, adjustedY),
                width: Math.abs(adjustedX - startX),
                height: Math.abs(adjustedY - startY),
              },
            });
          }
          break;
      }
    },
    [isDrawing, currentAnnotation, zoom, pan]
  );

  // Handle mouse up - finish drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentAnnotation) return;

    // Only add annotation if it has meaningful content
    if (currentAnnotation.type === 'pencil' && currentAnnotation.points && currentAnnotation.points.length > 2) {
      addAnnotation(currentAnnotation as Annotation);
    } else if (currentAnnotation.type === 'arrow' && currentAnnotation.points && currentAnnotation.points.length === 4) {
      addAnnotation(currentAnnotation as Annotation);
    } else if (currentAnnotation.type === 'highlight' && currentAnnotation.rect && 
               (currentAnnotation.rect.width > 5 || currentAnnotation.rect.height > 5)) {
      addAnnotation(currentAnnotation as Annotation);
    }

    setIsDrawing(false);
    setCurrentAnnotation(null);
  }, [isDrawing, currentAnnotation, addAnnotation]);

  // Render a single annotation
  const renderAnnotation = (annotation: Annotation) => {
    const key = annotation.id;

    switch (annotation.type) {
      case 'pencil':
        return (
          <Line
            key={key}
            points={annotation.points || []}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            onClick={() => {
              if (annotationMode) {
                removeAnnotation(annotation.id);
              }
            }}
          />
        );
      case 'arrow':
        return (
          <Arrow
            key={key}
            points={annotation.points || []}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
            fill={annotation.color}
            pointerLength={10}
            pointerWidth={10}
            onClick={() => {
              if (annotationMode) {
                removeAnnotation(annotation.id);
              }
            }}
          />
        );
      case 'highlight':
        return (
          <Rect
            key={key}
            x={annotation.rect?.x || 0}
            y={annotation.rect?.y || 0}
            width={annotation.rect?.width || 0}
            height={annotation.rect?.height || 0}
            fill={annotation.color}
            opacity={0.3}
            stroke={annotation.color}
            strokeWidth={1}
            onClick={() => {
              if (annotationMode) {
                removeAnnotation(annotation.id);
              }
            }}
          />
        );
      case 'text':
        return (
          <KonvaText
            key={key}
            x={annotation.position?.x || 0}
            y={annotation.position?.y || 0}
            text={annotation.text || ''}
            fontSize={16}
            fill={annotation.color}
            onClick={() => {
              if (annotationMode) {
                removeAnnotation(annotation.id);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  // Don't render if annotation mode is off
  if (!annotationMode) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: annotationMode ? 'auto' : 'none',
        zIndex: 1000,
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
          {/* Render existing annotations */}
          {annotations.map(renderAnnotation)}
          
          {/* Render current annotation being drawn */}
          {currentAnnotation && renderAnnotation(currentAnnotation as Annotation)}
        </Layer>
      </Stage>
    </div>
  );
};
