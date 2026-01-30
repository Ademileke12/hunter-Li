import React from 'react';
import type { WidgetInstance } from '../types';

interface PlaceholderWidgetProps {
  instance: WidgetInstance;
  title?: string;
}

/**
 * PlaceholderWidget Component
 * 
 * A temporary placeholder for widgets that haven't been implemented yet.
 * This allows the dynamic loading system to work while widgets are being developed.
 */
export const PlaceholderWidget: React.FC<PlaceholderWidgetProps> = ({ instance, title }) => {
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
        color: '#a0a0a0',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          marginBottom: '16px',
          opacity: 0.3,
        }}
      >
        📦
      </div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#e0e0e0',
        }}
      >
        {title || instance.type}
      </div>
      <div
        style={{
          fontSize: '14px',
          color: '#808080',
        }}
      >
        Widget implementation coming soon
      </div>
    </div>
  );
};

export default PlaceholderWidget;
