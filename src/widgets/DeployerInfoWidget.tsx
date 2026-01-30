import React from 'react';
import { PlaceholderWidget } from './PlaceholderWidget';
import type { WidgetInstance } from '../types';

interface DeployerInfoWidgetProps {
  instance: WidgetInstance;
}

const DeployerInfoWidget: React.FC<DeployerInfoWidgetProps> = ({ instance }) => {
  return <PlaceholderWidget instance={instance} title="Deployer Info" />;
};

export default DeployerInfoWidget;
