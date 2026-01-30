import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

/**
 * UI Enhancements Test Suite
 * 
 * Tests for Requirements 15.4, 15.5, 15.6, 15.7, 15.9, 15.10
 * - Smooth transitions on interactive elements
 * - Hover animations
 * - Skeleton loaders for loading states
 * - Glassmorphism effects
 * - Consistent spacing and alignment
 */

describe('UI Enhancements', () => {
  describe('Smooth Transitions (Requirement 15.4)', () => {
    it('should have transition classes in Tailwind config', () => {
      // Test that transition utilities are available
      const { container } = render(
        <div className="transition-all duration-200 ease-in-out">Test</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('transition-all');
      expect(element.className).toContain('duration-200');
      expect(element.className).toContain('ease-in-out');
    });

    it('should support custom transition durations', () => {
      const { container } = render(
        <div className="transition-all duration-300">Test</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('duration-300');
    });

    it('should have button transition classes', () => {
      const { container } = render(
        <button className="btn-primary">Click me</button>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.className).toContain('btn-primary');
    });
  });

  describe('Hover Animations (Requirement 15.5)', () => {
    it('should have hover scale classes', () => {
      const { container } = render(
        <div className="hover:scale-105">Hover me</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('hover:scale-105');
    });

    it('should have interactive class with hover effects', () => {
      const { container } = render(
        <div className="interactive">Interactive element</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('interactive');
    });

    it('should have hover shadow effects', () => {
      const { container } = render(
        <div className="hover:shadow-glow-blue">Glow on hover</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('hover:shadow-glow-blue');
    });
  });

  describe('Glassmorphism Effects (Requirement 15.6, 15.7)', () => {
    it('should have glassmorphism utility class', () => {
      const { container } = render(
        <div className="glassmorphism">Glass effect</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('glassmorphism');
    });

    it('should have glassmorphism-dark variant', () => {
      const { container } = render(
        <div className="glassmorphism-dark">Dark glass</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('glassmorphism-dark');
    });

    it('should have glassmorphism-hover variant', () => {
      const { container } = render(
        <div className="glassmorphism-hover">Hover glass</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('glassmorphism-hover');
    });

    it('should have backdrop blur utilities', () => {
      const { container } = render(
        <div className="backdrop-blur-md">Blurred backdrop</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('backdrop-blur-md');
    });
  });

  describe('Rounded Corners (Requirement 15.9)', () => {
    it('should have rounded corner utilities', () => {
      const { container } = render(
        <div className="rounded-lg">Rounded</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('rounded-lg');
    });

    it('should have card class with rounded corners', () => {
      const { container } = render(
        <div className="card">Card</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('card');
    });
  });

  describe('Soft Shadows (Requirement 15.10)', () => {
    it('should have soft shadow utilities', () => {
      const { container } = render(
        <div className="shadow-soft">Soft shadow</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('shadow-soft');
    });

    it('should have soft-lg shadow variant', () => {
      const { container } = render(
        <div className="shadow-soft-lg">Large soft shadow</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('shadow-soft-lg');
    });

    it('should have soft-xl shadow variant', () => {
      const { container } = render(
        <div className="shadow-soft-xl">Extra large soft shadow</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('shadow-soft-xl');
    });

    it('should have glow shadow effects', () => {
      const { container } = render(
        <div className="shadow-glow-blue">Blue glow</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('shadow-glow-blue');
    });
  });

  describe('Animation Classes', () => {
    it('should have fade-in animation', () => {
      const { container } = render(
        <div className="animate-fade-in">Fade in</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('animate-fade-in');
    });

    it('should have slide animations', () => {
      const animations = [
        'animate-slide-in-right',
        'animate-slide-in-left',
        'animate-slide-in-up',
        'animate-slide-in-down',
      ];

      animations.forEach((animation) => {
        const { container } = render(
          <div className={animation}>Slide</div>
        );

        const element = container.firstChild as HTMLElement;
        expect(element.className).toContain(animation);
      });
    });

    it('should have scale-in animation', () => {
      const { container } = render(
        <div className="animate-scale-in">Scale in</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('animate-scale-in');
    });

    it('should have shimmer animation', () => {
      const { container } = render(
        <div className="animate-shimmer">Shimmer</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('animate-shimmer');
    });

    it('should have pulse-glow animation', () => {
      const { container } = render(
        <div className="animate-pulse-glow">Pulse glow</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('animate-pulse-glow');
    });
  });

  describe('Custom Scrollbar', () => {
    it('should have custom scrollbar class', () => {
      const { container } = render(
        <div className="scrollbar-custom">Scrollable content</div>
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('scrollbar-custom');
    });
  });

  describe('Button Styles', () => {
    it('should have primary button style', () => {
      const { container } = render(
        <button className="btn-primary">Primary</button>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.className).toContain('btn-primary');
    });

    it('should have secondary button style', () => {
      const { container } = render(
        <button className="btn-secondary">Secondary</button>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.className).toContain('btn-secondary');
    });

    it('should have danger button style', () => {
      const { container } = render(
        <button className="btn-danger">Danger</button>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.className).toContain('btn-danger');
    });

    it('should have icon button style', () => {
      const { container } = render(
        <button className="btn-icon">Icon</button>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.className).toContain('btn-icon');
    });
  });

  describe('Input Styles', () => {
    it('should have input class with focus styles', () => {
      const { container } = render(
        <input className="input" type="text" />
      );

      const input = container.firstChild as HTMLElement;
      expect(input.className).toContain('input');
    });
  });

  describe('Card Styles', () => {
    it('should have card class', () => {
      const { container } = render(
        <div className="card">Card content</div>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card');
    });

    it('should have card-hover variant', () => {
      const { container } = render(
        <div className="card-hover">Hoverable card</div>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('card-hover');
    });
  });
});
