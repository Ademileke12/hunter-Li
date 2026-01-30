import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateAriaId,
  announceToScreenReader,
  isFocusable,
  getFocusableElements,
  trapFocus,
  hasGoodContrast,
  formatForScreenReader,
  createSkipLink,
} from './accessibility';

describe('Accessibility Utilities', () => {
  describe('generateAriaId', () => {
    it('should generate unique IDs with prefix', () => {
      const id1 = generateAriaId('tooltip');
      const id2 = generateAriaId('tooltip');
      
      expect(id1).toContain('tooltip-');
      expect(id2).toContain('tooltip-');
      expect(id1).not.toBe(id2);
    });
  });

  describe('announceToScreenReader', () => {
    afterEach(() => {
      // Clean up any announcements
      document.querySelectorAll('[role="status"]').forEach((el) => el.remove());
    });

    it('should create announcement element', () => {
      announceToScreenReader('Test message');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test message');
    });

    it('should set aria-live to polite by default', () => {
      announceToScreenReader('Test message');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement?.getAttribute('aria-live')).toBe('polite');
    });

    it('should support assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should create and remove announcement', () => {
      announceToScreenReader('Test message');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test message');
      
      // Clean up
      announcement?.remove();
    });
  });

  describe('isFocusable', () => {
    it('should return true for buttons', () => {
      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(true);
    });

    it('should return true for links', () => {
      const link = document.createElement('a');
      link.href = '#';
      expect(isFocusable(link)).toBe(true);
    });

    it('should return true for inputs', () => {
      const input = document.createElement('input');
      expect(isFocusable(input)).toBe(true);
    });

    it('should return false for elements with negative tabindex', () => {
      const div = document.createElement('div');
      div.tabIndex = -1;
      expect(isFocusable(div)).toBe(false);
    });

    it('should return true for elements with positive tabindex', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      expect(isFocusable(div)).toBe(true);
    });
  });

  describe('getFocusableElements', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should find all focusable elements', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <a href="#">Link</a>
        <input type="text" />
        <div tabindex="0">Focusable div</div>
        <div>Non-focusable div</div>
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(4);
    });

    it('should exclude disabled elements', () => {
      container.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
        <input type="text" />
        <input type="text" disabled />
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(2);
    });

    it('should exclude elements with negative tabindex', () => {
      container.innerHTML = `
        <button>Button</button>
        <div tabindex="-1">Hidden</div>
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(1);
    });
  });

  describe('trapFocus', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should focus first element on init', () => {
      trapFocus(container);
      
      const firstButton = document.getElementById('first');
      expect(document.activeElement).toBe(firstButton);
    });

    it('should return cleanup function', () => {
      const cleanup = trapFocus(container);
      expect(typeof cleanup).toBe('function');
      
      cleanup();
    });
  });

  describe('hasGoodContrast', () => {
    it('should return true for white on black', () => {
      const result = hasGoodContrast('#ffffff', '#000000');
      expect(result).toBe(true);
    });

    it('should return true for black on white', () => {
      const result = hasGoodContrast('#000000', '#ffffff');
      expect(result).toBe(true);
    });

    it('should return false for low contrast colors', () => {
      const result = hasGoodContrast('#cccccc', '#ffffff');
      expect(result).toBe(false);
    });
  });

  describe('formatForScreenReader', () => {
    it('should format currency values', () => {
      const result = formatForScreenReader(123.45, 'currency');
      expect(result).toBe('123.45 dollars');
    });

    it('should format percentage values', () => {
      const result = formatForScreenReader(45.67, 'percentage');
      expect(result).toBe('45.67 percent');
    });

    it('should format number values', () => {
      const result = formatForScreenReader(1234567, 'number');
      expect(result).toContain('1');
    });
  });

  describe('createSkipLink', () => {
    it('should create anchor element', () => {
      const skipLink = createSkipLink('main-content', 'Skip to main content');
      
      expect(skipLink.tagName).toBe('A');
      expect(skipLink.href).toContain('#main-content');
      expect(skipLink.textContent).toBe('Skip to main content');
    });

    it('should have sr-only class', () => {
      const skipLink = createSkipLink('main-content', 'Skip to main content');
      
      expect(skipLink.className).toContain('sr-only');
    });
  });
});
