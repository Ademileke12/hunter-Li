import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';

interface ErrorBoundaryProps {
  children: ReactNode;
  widgetId: string;
  widgetType: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches and handles errors in widget components to prevent
 * the entire application from crashing.
 * 
 * Features:
 * - Isolates widget errors
 * - Displays user-friendly error state
 * - Provides retry functionality
 * - Allows closing broken widgets
 * - Logs errors for debugging
 * 
 * Requirements: 19.3, 19.7
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to console for debugging
    console.error('Widget error caught by ErrorBoundary:', {
      widgetId: this.props.widgetId,
      widgetType: this.props.widgetType,
      error,
      errorInfo,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Optional: Send to error tracking service (e.g., Sentry)
    // trackError(error, { widgetId: this.props.widgetId, widgetType: this.props.widgetType });
  }

  handleRetry = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          widgetId={this.props.widgetId}
          widgetType={this.props.widgetType}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorState Component
 * 
 * Displays a user-friendly error message with retry and close options
 */
interface ErrorStateProps {
  widgetId: string;
  widgetType: string;
  error: Error | null;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ widgetId, widgetType, error, onRetry }) => {
  const { removeWidget } = useCanvasStore();

  const handleClose = (): void => {
    removeWidget(widgetId);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '24px',
        textAlign: 'center',
        color: '#e0e0e0',
      }}
    >
      {/* Error Icon */}
      <div
        style={{
          marginBottom: '16px',
          color: '#ff6464',
        }}
      >
        <AlertTriangle size={48} />
      </div>

      {/* Error Title */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#ff6464',
        }}
      >
        Widget Error
      </div>

      {/* Error Message */}
      <div
        style={{
          fontSize: '14px',
          color: '#a0a0a0',
          marginBottom: '4px',
        }}
      >
        The {widgetType} widget encountered an error
      </div>

      {/* Error Details (in development) */}
      {process.env.NODE_ENV === 'development' && error && (
        <div
          style={{
            fontSize: '12px',
            color: '#808080',
            marginTop: '8px',
            marginBottom: '16px',
            padding: '8px',
            background: 'rgba(255, 100, 100, 0.1)',
            borderRadius: '4px',
            maxWidth: '100%',
            overflow: 'auto',
            fontFamily: 'monospace',
            textAlign: 'left',
          }}
        >
          {error.message}
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
        }}
      >
        {/* Retry Button */}
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'rgba(100, 100, 255, 0.2)',
            border: '1px solid rgba(100, 100, 255, 0.4)',
            borderRadius: '6px',
            color: '#6464ff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(100, 100, 255, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(100, 100, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(100, 100, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(100, 100, 255, 0.4)';
          }}
        >
          <RefreshCw size={16} />
          Retry
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'rgba(255, 100, 100, 0.2)',
            border: '1px solid rgba(255, 100, 100, 0.4)',
            borderRadius: '6px',
            color: '#ff6464',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 100, 100, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 100, 100, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.4)';
          }}
        >
          <X size={16} />
          Close Widget
        </button>
      </div>
    </div>
  );
};

/**
 * Wrapper component to use ErrorBoundary with hooks
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};
