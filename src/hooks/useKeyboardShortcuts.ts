import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
}

/**
 * useKeyboardShortcuts Hook
 * 
 * Registers keyboard shortcuts for the application.
 * Supports modifier keys (Ctrl, Shift, Alt, Meta).
 * 
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether shortcuts are enabled
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault();
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Default keyboard shortcuts for the application
 */
export const getDefaultShortcuts = (handlers: {
  onPanLeft?: () => void;
  onPanRight?: () => void;
  onPanUp?: () => void;
  onPanDown?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onToggleToolLibrary?: () => void;
  onToggleAnnotations?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onPanLeft) {
    shortcuts.push({
      key: 'ArrowLeft',
      handler: handlers.onPanLeft,
      description: 'Pan canvas left',
    });
  }

  if (handlers.onPanRight) {
    shortcuts.push({
      key: 'ArrowRight',
      handler: handlers.onPanRight,
      description: 'Pan canvas right',
    });
  }

  if (handlers.onPanUp) {
    shortcuts.push({
      key: 'ArrowUp',
      handler: handlers.onPanUp,
      description: 'Pan canvas up',
    });
  }

  if (handlers.onPanDown) {
    shortcuts.push({
      key: 'ArrowDown',
      handler: handlers.onPanDown,
      description: 'Pan canvas down',
    });
  }

  if (handlers.onDelete) {
    shortcuts.push({
      key: 'Delete',
      handler: handlers.onDelete,
      description: 'Delete selected widget',
    });
  }

  if (handlers.onUndo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      handler: handlers.onUndo,
      description: 'Undo last action',
    });
  }

  if (handlers.onRedo) {
    shortcuts.push({
      key: 'y',
      ctrl: true,
      handler: handlers.onRedo,
      description: 'Redo last action',
    });
  }

  if (handlers.onZoomIn) {
    shortcuts.push({
      key: '+',
      ctrl: true,
      handler: handlers.onZoomIn,
      description: 'Zoom in',
    });
  }

  if (handlers.onZoomOut) {
    shortcuts.push({
      key: '-',
      ctrl: true,
      handler: handlers.onZoomOut,
      description: 'Zoom out',
    });
  }

  if (handlers.onToggleToolLibrary) {
    shortcuts.push({
      key: 't',
      ctrl: true,
      handler: handlers.onToggleToolLibrary,
      description: 'Toggle tool library',
    });
  }

  if (handlers.onToggleAnnotations) {
    shortcuts.push({
      key: 'a',
      ctrl: true,
      handler: handlers.onToggleAnnotations,
      description: 'Toggle annotations',
    });
  }

  return shortcuts;
};
