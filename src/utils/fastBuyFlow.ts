import type { Position } from '../types';

/**
 * Fast Buy Flow Utility
 * 
 * Orchestrates the Fast Buy flow by automatically adding and positioning
 * three widgets: chart (DexScreener), token overview, and swap widget.
 * 
 * The layout algorithm positions widgets optimally:
 * - Chart: Large widget on the left (800x600)
 * - Token Overview: Medium widget on top-right (400x300)
 * - Swap: Medium widget on bottom-right (400x400)
 */

export interface FastBuyFlowParams {
  tokenAddress: string;
  viewportCenter?: Position;
}

export interface FastBuyFlowResult {
  chartWidgetId: string;
  overviewWidgetId: string;
  swapWidgetId: string;
  positions: {
    chart: Position;
    overview: Position;
    swap: Position;
  };
}

/**
 * Calculate optimal layout positions for Fast Buy widgets
 * 
 * Layout strategy:
 * - Chart positioned at center-left
 * - Overview positioned at top-right of chart
 * - Swap positioned below overview
 * - All widgets visible in viewport with proper spacing
 */
export function calculateFastBuyLayout(viewportCenter?: Position): {
  chart: Position;
  overview: Position;
  swap: Position;
} {
  // Use provided viewport center or default to screen center
  const centerX = viewportCenter?.x ?? window.innerWidth / 2;
  const centerY = viewportCenter?.y ?? window.innerHeight / 2;

  // Widget dimensions
  const chartSize = { width: 800, height: 600 };
  const overviewSize = { width: 400, height: 300 };
  const swapSize = { width: 400, height: 400 };

  // Spacing between widgets
  const spacing = 20;

  // Calculate positions
  // Chart: positioned to the left of center
  const chartPosition: Position = {
    x: centerX - chartSize.width - spacing,
    y: centerY - chartSize.height / 2,
  };

  // Overview: positioned to the right of chart, aligned with top
  const overviewPosition: Position = {
    x: chartPosition.x + chartSize.width + spacing,
    y: chartPosition.y,
  };

  // Swap: positioned below overview
  const swapPosition: Position = {
    x: overviewPosition.x,
    y: overviewPosition.y + overviewSize.height + spacing,
  };

  return {
    chart: chartPosition,
    overview: overviewPosition,
    swap: swapPosition,
  };
}

/**
 * Validate token address format
 * Basic validation for Solana token addresses (base58, 32-44 chars)
 */
export function isValidTokenAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Solana addresses are base58 encoded and typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}
