/**
 * Error Notification Component
 * 
 * Displays user-friendly error notifications with recovery suggestions.
 * Supports different error types and severity levels.
 * 
 * Requirements: 19.1, 19.7
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Info, AlertCircle, XCircle } from 'lucide-react';
import { AppError, ErrorSeverity, getUserFriendlyErrorMessage, getErrorRecoverySuggestions } from '../utils/errorHandling';

export interface ErrorNotificationProps {
  error: unknown;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

/**
 * ErrorNotification Component
 * 
 * Displays error messages with appropriate styling based on severity.
 * Provides recovery suggestions and allows manual dismissal.
 */
export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-close timer
  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  // Get error details
  const message = getUserFriendlyErrorMessage(error);
  const suggestions = getErrorRecoverySuggestions(error);
  const severity = error instanceof AppError ? error.severity : ErrorSeverity.ERROR;

  // Get icon and colors based on severity
  const { Icon, bgColor, borderColor, iconColor, textColor } = getSeverityStyle(severity);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        maxWidth: '400px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        animation: isVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {/* Icon */}
        <div style={{ color: iconColor, flexShrink: 0 }}>
          <Icon size={24} />
        </div>

        {/* Message */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: textColor,
              marginBottom: '4px',
            }}
          >
            {getSeverityTitle(severity)}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#d0d0d0',
              lineHeight: '1.5',
            }}
          >
            {message}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#808080',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#808080';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Recovery suggestions */}
      {suggestions.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#a0a0a0',
              marginBottom: '6px',
            }}
          >
            Try this:
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '12px',
              color: '#c0c0c0',
              lineHeight: '1.6',
            }}
          >
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Development details */}
      {process.env.NODE_ENV === 'development' && error instanceof Error && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            color: '#808080',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Debug:</div>
          {error.message}
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

// Helper functions
function getSeverityStyle(severity: ErrorSeverity) {
  switch (severity) {
    case ErrorSeverity.INFO:
      return {
        Icon: Info,
        bgColor: 'rgba(100, 100, 255, 0.15)',
        borderColor: 'rgba(100, 100, 255, 0.4)',
        iconColor: '#6464ff',
        textColor: '#8888ff',
      };
    case ErrorSeverity.WARNING:
      return {
        Icon: AlertTriangle,
        bgColor: 'rgba(255, 200, 100, 0.15)',
        borderColor: 'rgba(255, 200, 100, 0.4)',
        iconColor: '#ffc864',
        textColor: '#ffd888',
      };
    case ErrorSeverity.ERROR:
      return {
        Icon: AlertCircle,
        bgColor: 'rgba(255, 100, 100, 0.15)',
        borderColor: 'rgba(255, 100, 100, 0.4)',
        iconColor: '#ff6464',
        textColor: '#ff8888',
      };
    case ErrorSeverity.CRITICAL:
      return {
        Icon: XCircle,
        bgColor: 'rgba(200, 0, 0, 0.2)',
        borderColor: 'rgba(255, 0, 0, 0.5)',
        iconColor: '#ff0000',
        textColor: '#ff4444',
      };
    default:
      return {
        Icon: AlertCircle,
        bgColor: 'rgba(255, 100, 100, 0.15)',
        borderColor: 'rgba(255, 100, 100, 0.4)',
        iconColor: '#ff6464',
        textColor: '#ff8888',
      };
  }
}

function getSeverityTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'Information';
    case ErrorSeverity.WARNING:
      return 'Warning';
    case ErrorSeverity.ERROR:
      return 'Error';
    case ErrorSeverity.CRITICAL:
      return 'Critical Error';
    default:
      return 'Error';
  }
}

/**
 * Error Notification Container
 * 
 * Manages multiple error notifications in a stack.
 */
interface ErrorNotificationContainerProps {
  errors: Array<{ id: string; error: unknown }>;
  onDismiss: (id: string) => void;
}

export const ErrorNotificationContainer: React.FC<ErrorNotificationContainerProps> = ({
  errors,
  onDismiss,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}
    >
      {errors.map(({ id, error }) => (
        <div key={id} style={{ pointerEvents: 'auto' }}>
          <ErrorNotification
            error={error}
            onClose={() => onDismiss(id)}
          />
        </div>
      ))}
    </div>
  );
};
