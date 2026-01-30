import React from 'react';
import { useUIStore } from '../stores/uiStore';
import { useCanvasStore } from '../stores/canvasStore';
import type { DrawingTool } from '../types';
import { Pencil, ArrowRight, Highlighter, Type, Eye, EyeOff, Trash2 } from 'lucide-react';

export const AnnotationToolbar: React.FC = () => {
  const { annotationMode, selectedTool, setAnnotationMode, setSelectedTool } = useUIStore();
  const { annotations, clearAnnotations } = useCanvasStore();

  const tools: { type: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { type: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
    { type: 'arrow', icon: <ArrowRight size={20} />, label: 'Arrow' },
    { type: 'highlight', icon: <Highlighter size={20} />, label: 'Highlight' },
    { type: 'text', icon: <Type size={20} />, label: 'Text' },
  ];

  const handleToolSelect = (tool: DrawingTool) => {
    if (selectedTool === tool) {
      // Deselect if clicking the same tool
      setSelectedTool(null);
      setAnnotationMode(false);
    } else {
      setSelectedTool(tool);
      setAnnotationMode(true);
    }
  };

  const handleToggleVisibility = () => {
    setAnnotationMode(!annotationMode);
    if (annotationMode) {
      setSelectedTool(null);
    }
  };

  const handleClearAll = () => {
    if (annotations.length > 0) {
      const confirmed = window.confirm(
        `Are you sure you want to clear all ${annotations.length} annotation(s)?`
      );
      if (confirmed) {
        clearAnnotations();
      }
    }
  };

  return (
    <div
      className="annotation-toolbar"
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        backgroundColor: 'rgba(15, 15, 25, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1001,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Drawing tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => handleToolSelect(tool.type)}
            title={tool.label}
            style={{
              padding: '10px',
              backgroundColor:
                selectedTool === tool.type
                  ? 'rgba(0, 212, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
              border:
                selectedTool === tool.type
                  ? '1px solid rgba(0, 212, 255, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: selectedTool === tool.type ? '#00d4ff' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (selectedTool !== tool.type) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTool !== tool.type) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          margin: '4px 0',
        }}
      />

      {/* Visibility toggle */}
      <button
        onClick={handleToggleVisibility}
        title={annotationMode ? 'Hide annotations' : 'Show annotations'}
        style={{
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: annotationMode ? '#00d4ff' : '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        {annotationMode ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>

      {/* Clear all button */}
      <button
        onClick={handleClearAll}
        title="Clear all annotations"
        disabled={annotations.length === 0}
        style={{
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: annotations.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#ff4444',
          cursor: annotations.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          opacity: annotations.length === 0 ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (annotations.length > 0) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (annotations.length > 0) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }
        }}
      >
        <Trash2 size={20} />
      </button>

      {/* Annotation count */}
      {annotations.length > 0 && (
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            marginTop: '4px',
          }}
        >
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
