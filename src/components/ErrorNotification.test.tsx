import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorNotification, ErrorNotificationContainer } from './ErrorNotification';
import { AppError, ErrorType, ErrorSeverity, NetworkError, StorageError } from '../utils/errorHandling';

describe('ErrorNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render error message', () => {
    const error = new Error('Test error message');
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
  });

  it('should display user-friendly message for AppError', () => {
    const error = new AppError(
      'Technical error',
      ErrorType.NETWORK,
      ErrorSeverity.ERROR,
      'User-friendly message'
    );
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText('User-friendly message')).toBeInTheDocument();
  });

  it('should display recovery suggestions', () => {
    const error = new NetworkError('Network failed');
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText(/Try this:/i)).toBeInTheDocument();
    expect(screen.getByText(/internet connection/i)).toBeInTheDocument();
  });

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const error = new Error('Test error');
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);

    // Wait for animation
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should auto-close after delay', async () => {
    const error = new Error('Test error');
    const onClose = vi.fn();

    render(
      <ErrorNotification
        error={error}
        onClose={onClose}
        autoClose={true}
        autoCloseDelay={3000}
      />
    );

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    // Wait for animation
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should not auto-close when autoClose is false', async () => {
    const error = new Error('Test error');
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    // Fast-forward time
    vi.advanceTimersByTime(10000);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should display info severity correctly', () => {
    const error = new AppError('Info', ErrorType.UNKNOWN, ErrorSeverity.INFO);
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText('Information')).toBeInTheDocument();
  });

  it('should display warning severity correctly', () => {
    const error = new AppError('Warning', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should display error severity correctly', () => {
    const error = new AppError('Error', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should display critical severity correctly', () => {
    const error = new AppError('Critical', ErrorType.UNKNOWN, ErrorSeverity.CRITICAL);
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText('Critical Error')).toBeInTheDocument();
  });

  it('should show debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Technical error message');
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    expect(screen.getByText('Debug:')).toBeInTheDocument();
    expect(screen.getByText('Technical error message')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle storage errors with specific suggestions', () => {
    const error = new StorageError('Storage full');
    const onClose = vi.fn();

    render(<ErrorNotification error={error} onClose={onClose} autoClose={false} />);

    // Check for the user message
    expect(screen.getByText(/save data/i)).toBeInTheDocument();
    // Check for storage-specific suggestion
    expect(screen.getByText(/Clear browser cache/i)).toBeInTheDocument();
  });
});

describe('ErrorNotificationContainer', () => {
  it('should render multiple error notifications', () => {
    const errors = [
      { id: '1', error: new Error('Error 1') },
      { id: '2', error: new Error('Error 2') },
    ];
    const onDismiss = vi.fn();

    render(<ErrorNotificationContainer errors={errors} onDismiss={onDismiss} />);

    // Both errors should be visible
    const errorElements = screen.getAllByText(/error occurred/i);
    expect(errorElements.length).toBe(2);
  });

  it('should dismiss individual errors', async () => {
    const user = userEvent.setup({ delay: null });
    const errors = [
      { id: '1', error: new Error('Error 1') },
      { id: '2', error: new Error('Error 2') },
    ];
    const onDismiss = vi.fn();

    render(<ErrorNotificationContainer errors={errors} onDismiss={onDismiss} />);

    // Click first close button
    const closeButtons = screen.getAllByRole('button');
    await user.click(closeButtons[0]);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('1');
    });
  });

  it('should render empty container when no errors', () => {
    const onDismiss = vi.fn();

    const { container } = render(
      <ErrorNotificationContainer errors={[]} onDismiss={onDismiss} />
    );

    expect(container.firstChild?.childNodes.length).toBe(0);
  });
});
