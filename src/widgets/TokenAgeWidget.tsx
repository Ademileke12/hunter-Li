import React from 'react';
import { PlaceholderWidget } from './PlaceholderWidget';
import type { WidgetInstance } from '../types';

interface TokenAgeWidgetProps {
  instance: WidgetInstance;
}

const TokenAgeWidget: React.FC<TokenAgeWidgetProps> = ({ instance }) => {
  return <PlaceholderWidget instance={instance} title="Token Age" />;
};

export default TokenAgeWidget;
