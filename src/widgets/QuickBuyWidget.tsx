import React from 'react';
import { PlaceholderWidget } from './PlaceholderWidget';
import type { WidgetInstance } from '../types';

interface QuickBuyWidgetProps {
  instance: WidgetInstance;
}

const QuickBuyWidget: React.FC<QuickBuyWidgetProps> = ({ instance }) => {
  return <PlaceholderWidget instance={instance} title="Quick Buy" />;
};

export default QuickBuyWidget;
