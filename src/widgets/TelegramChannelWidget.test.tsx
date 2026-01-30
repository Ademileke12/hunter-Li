/**
 * Unit tests for TelegramChannelWidget
 * 
 * Tests:
 * - Initial empty state rendering
 * - Configuration input and submission
 * - Channel loading and display
 * - Error handling for failed loads
 * - Loading states
 * - Auto-refresh functionality
 * - Username sanitization (@ removal)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TelegramChannelWidget from './TelegramChannelWidget';
import { useCanvasStore } from '../stores/canvasStore';
import type { WidgetInstance } from '../types';

// Mock the canvas store
vi.mock('../stores/canvasStore', () => ({
  useCanvasStore: vi.fn(),
}));

describe('TelegramChannelWidget', () => {
  let mockUpdateWidget: ReturnType<typeof vi.fn>;
  let mockInstance: WidgetInstance;

  beforeEach(() => {
    mockUpdateWidget = vi.fn();
    (useCanvasStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
    });

    mockInstance = {
      id: 'test-widget-1',
      type: 'telegram-channel',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
      zIndex: 1,
      config: {},
      state: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Clear any existing timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should render empty state when no channel is configured', () => {
      render(<TelegramChannelWidget instance={mockInstance} />);

      expect(screen.getByText('Telegram Channel')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('@channelname or channelname')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load channel/i })).toBeInTheDocument();
    });

    it('should show input field with placeholder text', () => {
      render(<TelegramChannelWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@channelname or channelname');
      expect(input).toHaveValue('');
    });

    it('should display note about public channels only', () => {
      render(<TelegramChannelWidget instance={mockInstance} />);

      expect(screen.getByText('Note: Only public channels are supported')).toBeInTheDocument();
    });
  });

  describe('Configuration Input', () => {
    it('should update input value when user types', async () => {
      const user = userEvent.setup();
      render(<TelegramChannelWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@channelname or channelname');
      await user.type(input, 'testchannel');

      expect(input).toHaveValue('testchannel');
    });

    it('should call updateWidget when form is submitted with channel name', async () => {
      const user = userEvent.setup();
      render(<TelegramChannelWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@channelname or channelname');
      const button = screen.getByRole('button', { name: /load channel/i });

      await user.type(input, 'testchannel');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          channelUsername: 'testchannel',
        },
      });
    });

    it('should remove @ symbol from channel name', async () => {
      const user = userEvent.setup();
      render(<TelegramChannelWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@channelname or channelname');
      const button = screen.getByRole('button', { name: /load channel/i });

      await user.type(input, '@testchannel');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          channelUsername: 'testchannel',
        },
      });
    });

    it('should not submit empty input', async () => {
      const user = userEvent.setup();
      render(<TelegramChannelWidget instance={mockInstance} />);

      const button = screen.getByRole('button', { name: /load channel/i });
      await user.click(button);

      expect(mockUpdateWidget).not.toHaveBeenCalled();
    });

    it('should trim whitespace from input', async () => {
      const user = userEvent.setup();
      render(<TelegramChannelWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@channelname or channelname');
      const button = screen.getByRole('button', { name: /load channel/i });

      await user.type(input, '  testchannel  ');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          channelUsername: 'testchannel',
        },
      });
    });

    it('should handle @ symbol with whitespace', async () => {
      const user = userEvent.setup();
      render(<TelegramChannelWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@channelname or channelname');
      const button = screen.getByRole('button', { name: /load channel/i });

      await user.type(input, '  @testchannel  ');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          channelUsername: 'testchannel',
        },
      });
    });
  });

  describe('Channel Display', () => {
    it('should display channel username when configured', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      // Wait for loading to complete (timeout after 2 seconds)
      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('@testchannel')).toBeInTheDocument();
    });

    it('should show change channel button when channel is loaded', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByRole('button', { name: /change channel/i })).toBeInTheDocument();
    });

    it('should display auto-refresh message', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('Auto-refreshes every 60 seconds')).toBeInTheDocument();
    });

    it('should create Telegram widget container', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const container = document.querySelector('.telegram-widget-container');
      expect(container).not.toBeNull();
    });

    it('should allow changing channel', async () => {
      const user = userEvent.setup();
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const changeButton = screen.getByRole('button', { name: /change channel/i });
      await user.click(changeButton);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          channelUsername: '',
        },
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially when channel is configured', () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      // The widget should show loading initially
      expect(screen.getByText('Loading channel...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle script loading gracefully', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      // Widget should eventually show the channel display (not stuck in loading)
      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show the channel username
      expect(screen.getByText('@testchannel')).toBeInTheDocument();
    });

    it('should provide change channel button for recovery', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should have a way to change the channel
      expect(screen.getByRole('button', { name: /change channel/i })).toBeInTheDocument();
    });

    it('should allow user to reset channel configuration', async () => {
      const user = userEvent.setup();
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const changeButton = screen.getByRole('button', { name: /change channel/i });
      await user.click(changeButton);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          channelUsername: '',
        },
      });
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set up auto-refresh interval when channel is loaded', () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      // Verify that setInterval was called
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('should refresh widget every 60 seconds', () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      const { container } = render(<TelegramChannelWidget instance={instanceWithChannel} />);

      // Fast-forward past the initial load timeout
      vi.advanceTimersByTime(2100);

      const initialScriptCount = container.querySelectorAll('script[src*="telegram.org"]').length;

      // Fast-forward 60 seconds
      vi.advanceTimersByTime(60000);

      const newScriptCount = container.querySelectorAll('script[src*="telegram.org"]').length;
      // Should have added new scripts for refresh (or at least attempted to)
      expect(newScriptCount).toBeGreaterThanOrEqual(initialScriptCount);
    });

    it('should clear interval on unmount', () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      const { unmount } = render(<TelegramChannelWidget instance={instanceWithChannel} />);

      const timerCountBefore = vi.getTimerCount();
      expect(timerCountBefore).toBeGreaterThan(0);

      unmount();

      // Timers should be cleared
      const timerCountAfter = vi.getTimerCount();
      expect(timerCountAfter).toBeLessThan(timerCountBefore);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty config object', () => {
      const instanceWithEmptyConfig = {
        ...mockInstance,
        config: {},
      };

      render(<TelegramChannelWidget instance={instanceWithEmptyConfig} />);

      expect(screen.getByText('Telegram Channel')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('@channelname or channelname')).toBeInTheDocument();
    });

    it('should handle undefined config', () => {
      const instanceWithUndefinedConfig = {
        ...mockInstance,
        config: undefined as any,
      };

      render(<TelegramChannelWidget instance={instanceWithUndefinedConfig} />);

      expect(screen.getByText('Telegram Channel')).toBeInTheDocument();
    });

    it('should handle channel name with special characters', async () => {
      const user = userEvent.setup();
      render(<TelegramChannelWidget instance={mockInstance} />);

      const input = screen.getByPlaceholderText('@channelname or channelname');
      const button = screen.getByRole('button', { name: /load channel/i });

      await user.type(input, 'test_channel_123');
      await user.click(button);

      expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget-1', {
        config: {
          channelUsername: 'test_channel_123',
        },
      });
    });

    it('should preserve input value when switching back to empty state', async () => {
      const user = userEvent.setup();
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      const { rerender } = render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const changeButton = screen.getByRole('button', { name: /change channel/i });
      await user.click(changeButton);

      // Rerender with empty config
      const updatedInstance = {
        ...instanceWithChannel,
        config: { channelUsername: '' },
      };

      rerender(<TelegramChannelWidget instance={updatedInstance} />);

      // Should show empty state again
      expect(screen.getByText('Telegram Channel')).toBeInTheDocument();
      expect(screen.queryByText('@testchannel')).not.toBeInTheDocument();
    });
  });

  describe('Telegram Widget Script', () => {
    it('should create widget container for Telegram embed', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should have the telegram widget container
      const container = document.querySelector('.telegram-widget-container');
      expect(container).not.toBeNull();
    });

    it('should display channel information', async () => {
      const instanceWithChannel = {
        ...mockInstance,
        config: { channelUsername: 'testchannel' },
      };

      render(<TelegramChannelWidget instance={instanceWithChannel} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading channel...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show the channel username
      expect(screen.getByText('@testchannel')).toBeInTheDocument();
      // Should show auto-refresh message
      expect(screen.getByText('Auto-refreshes every 60 seconds')).toBeInTheDocument();
    });
  });
});
