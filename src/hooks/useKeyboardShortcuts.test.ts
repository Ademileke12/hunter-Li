import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, getDefaultShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register keyboard shortcuts', () => {
    const handler = vi.fn();
    const shortcuts = [
      {
        key: 'a',
        handler,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Simulate keydown event
    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle modifier keys', () => {
    const handler = vi.fn();
    const shortcuts = [
      {
        key: 'z',
        ctrl: true,
        handler,
        description: 'Undo',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Simulate Ctrl+Z
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not trigger when disabled', () => {
    const handler = vi.fn();
    const shortcuts = [
      {
        key: 'a',
        handler,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, false));

    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not trigger when typing in input', () => {
    const handler = vi.fn();
    const shortcuts = [
      {
        key: 'a',
        handler,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Create an input element and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    input.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should prevent default behavior', () => {
    const handler = vi.fn();
    const shortcuts = [
      {
        key: 'a',
        handler,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    const event = new KeyboardEvent('keydown', { key: 'a' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should cleanup event listeners on unmount', () => {
    const handler = vi.fn();
    const shortcuts = [
      {
        key: 'a',
        handler,
        description: 'Test shortcut',
      },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts, true));

    unmount();

    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('getDefaultShortcuts', () => {
  it('should generate shortcuts for all provided handlers', () => {
    const handlers = {
      onPanLeft: vi.fn(),
      onPanRight: vi.fn(),
      onPanUp: vi.fn(),
      onPanDown: vi.fn(),
      onDelete: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleToolLibrary: vi.fn(),
      onToggleAnnotations: vi.fn(),
    };

    const shortcuts = getDefaultShortcuts(handlers);

    expect(shortcuts).toHaveLength(11);
    expect(shortcuts.every((s) => s.description)).toBe(true);
  });

  it('should only generate shortcuts for provided handlers', () => {
    const handlers = {
      onPanLeft: vi.fn(),
      onDelete: vi.fn(),
    };

    const shortcuts = getDefaultShortcuts(handlers);

    expect(shortcuts).toHaveLength(2);
    expect(shortcuts.find((s) => s.key === 'ArrowLeft')).toBeDefined();
    expect(shortcuts.find((s) => s.key === 'Delete')).toBeDefined();
  });

  it('should configure modifier keys correctly', () => {
    const handlers = {
      onUndo: vi.fn(),
      onZoomIn: vi.fn(),
    };

    const shortcuts = getDefaultShortcuts(handlers);

    const undoShortcut = shortcuts.find((s) => s.key === 'z');
    expect(undoShortcut?.ctrl).toBe(true);

    const zoomInShortcut = shortcuts.find((s) => s.key === '+');
    expect(zoomInShortcut?.ctrl).toBe(true);
  });
});
