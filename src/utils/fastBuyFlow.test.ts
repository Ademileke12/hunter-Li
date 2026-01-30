import { describe, it, expect } from 'vitest';
import { calculateFastBuyLayout, isValidTokenAddress } from './fastBuyFlow';

describe('fastBuyFlow', () => {
  describe('calculateFastBuyLayout', () => {
    it('should calculate positions with default viewport center', () => {
      const layout = calculateFastBuyLayout();

      expect(layout).toHaveProperty('chart');
      expect(layout).toHaveProperty('overview');
      expect(layout).toHaveProperty('swap');

      // Verify positions are objects with x and y
      expect(layout.chart).toHaveProperty('x');
      expect(layout.chart).toHaveProperty('y');
      expect(layout.overview).toHaveProperty('x');
      expect(layout.overview).toHaveProperty('y');
      expect(layout.swap).toHaveProperty('x');
      expect(layout.swap).toHaveProperty('y');
    });

    it('should calculate positions with custom viewport center', () => {
      const viewportCenter = { x: 1000, y: 500 };
      const layout = calculateFastBuyLayout(viewportCenter);

      // Chart should be positioned to the left of center
      expect(layout.chart.x).toBeLessThan(viewportCenter.x);

      // Overview should be to the right of chart
      expect(layout.overview.x).toBeGreaterThan(layout.chart.x);

      // Swap should be below overview
      expect(layout.swap.y).toBeGreaterThan(layout.overview.y);
    });

    it('should maintain proper spacing between widgets', () => {
      const layout = calculateFastBuyLayout();
      const spacing = 20;
      const chartWidth = 800;
      const overviewHeight = 300;

      // Overview should be spaced from chart
      expect(layout.overview.x).toBe(layout.chart.x + chartWidth + spacing);

      // Swap should be spaced from overview
      expect(layout.swap.y).toBe(layout.overview.y + overviewHeight + spacing);

      // Swap and overview should have same x position
      expect(layout.swap.x).toBe(layout.overview.x);
    });
  });

  describe('isValidTokenAddress', () => {
    it('should validate correct Solana token addresses', () => {
      const validAddresses = [
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
      ];

      validAddresses.forEach((address) => {
        expect(isValidTokenAddress(address)).toBe(true);
      });
    });

    it('should reject invalid token addresses', () => {
      const invalidAddresses = [
        '', // Empty
        'invalid', // Too short
        '0x1234567890123456789012345678901234567890', // Ethereum format
        'So11111111111111111111111111111111111111112!', // Invalid character
        'So1111111111111111111111111111111111111111200000000000000000000', // Too long
        null,
        undefined,
        123,
      ];

      invalidAddresses.forEach((address) => {
        expect(isValidTokenAddress(address as any)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      // Minimum valid length (32 chars)
      expect(isValidTokenAddress('1'.repeat(32))).toBe(true);

      // Maximum valid length (44 chars)
      expect(isValidTokenAddress('1'.repeat(44))).toBe(true);

      // Just below minimum
      expect(isValidTokenAddress('1'.repeat(31))).toBe(false);

      // Just above maximum
      expect(isValidTokenAddress('1'.repeat(45))).toBe(false);
    });
  });
});
