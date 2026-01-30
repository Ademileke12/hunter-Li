import { describe, it, expect } from 'vitest';
import {
  widgetRegistry,
  getWidgetDefinition,
  getWidgetsByCategory,
  getWidgetCategories,
  isValidWidgetType,
} from './widgetRegistry';
import type { WidgetType, WidgetCategory } from '../types';

describe('Widget Registry', () => {
  describe('widgetRegistry', () => {
    it('should contain all expected widget types', () => {
      const expectedTypes: WidgetType[] = [
        'dexscreener',
        'dextools',
        'birdeye',
        'new-pairs',
        'trending',
        'token-overview',
        'holder-distribution',
        'lp-overview',
        'token-age',
        'deployer-info',
        'risk-flags',
        'swap',
        'quick-buy',
        'twitter-embed',
        'telegram-channel',
        'rss-feed',
        'notes',
        'checklist',
        'block-clock',
        'pnl-tracker',
      ];

      expectedTypes.forEach((type) => {
        expect(widgetRegistry[type]).toBeDefined();
        expect(widgetRegistry[type].type).toBe(type);
      });
    });

    it('should have valid structure for each widget definition', () => {
      Object.values(widgetRegistry).forEach((definition) => {
        // Check required fields
        expect(definition.type).toBeDefined();
        expect(definition.category).toBeDefined();
        expect(definition.icon).toBeDefined();
        expect(definition.label).toBeDefined();
        expect(definition.component).toBeDefined();
        expect(definition.defaultSize).toBeDefined();
        expect(definition.minSize).toBeDefined();
        expect(definition.defaultConfig).toBeDefined();

        // Check size constraints
        expect(definition.defaultSize.width).toBeGreaterThan(0);
        expect(definition.defaultSize.height).toBeGreaterThan(0);
        expect(definition.minSize.width).toBeGreaterThan(0);
        expect(definition.minSize.height).toBeGreaterThan(0);

        // Check default size is >= min size
        expect(definition.defaultSize.width).toBeGreaterThanOrEqual(definition.minSize.width);
        expect(definition.defaultSize.height).toBeGreaterThanOrEqual(definition.minSize.height);

        // If maxSize is defined, check constraints
        if (definition.maxSize) {
          expect(definition.maxSize.width).toBeGreaterThanOrEqual(definition.defaultSize.width);
          expect(definition.maxSize.height).toBeGreaterThanOrEqual(definition.defaultSize.height);
        }

        // Check label is a translation key
        expect(definition.label).toMatch(/^widgets\./);
      });
    });

    it('should categorize widgets correctly', () => {
      const discoveryWidgets = ['dexscreener', 'dextools', 'birdeye', 'new-pairs', 'trending'];
      const analysisWidgets = [
        'token-overview',
        'holder-distribution',
        'lp-overview',
        'token-age',
        'deployer-info',
        'risk-flags',
      ];
      const executionWidgets = ['swap', 'quick-buy'];
      const alphaWidgets = ['twitter-embed', 'telegram-channel', 'rss-feed'];
      const utilityWidgets = ['notes', 'checklist', 'block-clock', 'pnl-tracker'];

      discoveryWidgets.forEach((type) => {
        expect(widgetRegistry[type as WidgetType].category).toBe('discovery');
      });

      analysisWidgets.forEach((type) => {
        expect(widgetRegistry[type as WidgetType].category).toBe('analysis');
      });

      executionWidgets.forEach((type) => {
        expect(widgetRegistry[type as WidgetType].category).toBe('execution');
      });

      alphaWidgets.forEach((type) => {
        expect(widgetRegistry[type as WidgetType].category).toBe('alpha');
      });

      utilityWidgets.forEach((type) => {
        expect(widgetRegistry[type as WidgetType].category).toBe('utilities');
      });
    });
  });

  describe('getWidgetDefinition', () => {
    it('should return widget definition for valid type', () => {
      const definition = getWidgetDefinition('swap');
      expect(definition).toBeDefined();
      expect(definition?.type).toBe('swap');
      expect(definition?.category).toBe('execution');
    });

    it('should return undefined for invalid type', () => {
      const definition = getWidgetDefinition('invalid-widget' as WidgetType);
      expect(definition).toBeUndefined();
    });

    it('should return correct definition for each widget type', () => {
      const types: WidgetType[] = ['dexscreener', 'notes', 'swap', 'token-overview'];
      types.forEach((type) => {
        const definition = getWidgetDefinition(type);
        expect(definition).toBeDefined();
        expect(definition?.type).toBe(type);
      });
    });
  });

  describe('getWidgetsByCategory', () => {
    it('should return all discovery widgets', () => {
      const widgets = getWidgetsByCategory('discovery');
      expect(widgets.length).toBe(5);
      widgets.forEach((widget) => {
        expect(widget.category).toBe('discovery');
      });
    });

    it('should return all analysis widgets', () => {
      const widgets = getWidgetsByCategory('analysis');
      expect(widgets.length).toBe(6);
      widgets.forEach((widget) => {
        expect(widget.category).toBe('analysis');
      });
    });

    it('should return all execution widgets', () => {
      const widgets = getWidgetsByCategory('execution');
      expect(widgets.length).toBe(2);
      widgets.forEach((widget) => {
        expect(widget.category).toBe('execution');
      });
    });

    it('should return all alpha widgets', () => {
      const widgets = getWidgetsByCategory('alpha');
      expect(widgets.length).toBe(3);
      widgets.forEach((widget) => {
        expect(widget.category).toBe('alpha');
      });
    });

    it('should return all utility widgets', () => {
      const widgets = getWidgetsByCategory('utilities');
      expect(widgets.length).toBe(4);
      widgets.forEach((widget) => {
        expect(widget.category).toBe('utilities');
      });
    });

    it('should return empty array for invalid category', () => {
      const widgets = getWidgetsByCategory('invalid-category');
      expect(widgets).toEqual([]);
    });
  });

  describe('getWidgetCategories', () => {
    it('should return all unique categories', () => {
      const categories = getWidgetCategories();
      expect(categories).toHaveLength(5);
      expect(categories).toContain('discovery');
      expect(categories).toContain('analysis');
      expect(categories).toContain('execution');
      expect(categories).toContain('alpha');
      expect(categories).toContain('utilities');
    });

    it('should not contain duplicates', () => {
      const categories = getWidgetCategories();
      const uniqueCategories = new Set(categories);
      expect(categories.length).toBe(uniqueCategories.size);
    });
  });

  describe('isValidWidgetType', () => {
    it('should return true for valid widget types', () => {
      expect(isValidWidgetType('swap')).toBe(true);
      expect(isValidWidgetType('notes')).toBe(true);
      expect(isValidWidgetType('dexscreener')).toBe(true);
      expect(isValidWidgetType('token-overview')).toBe(true);
    });

    it('should return false for invalid widget types', () => {
      expect(isValidWidgetType('invalid-widget')).toBe(false);
      expect(isValidWidgetType('')).toBe(false);
      expect(isValidWidgetType('random-string')).toBe(false);
    });

    it('should work as type guard', () => {
      const type: string = 'swap';
      if (isValidWidgetType(type)) {
        // TypeScript should recognize type as WidgetType here
        const definition = getWidgetDefinition(type);
        expect(definition).toBeDefined();
      }
    });
  });

  describe('Widget-specific configurations', () => {
    it('should have appropriate default configs for discovery widgets', () => {
      const newPairs = getWidgetDefinition('new-pairs');
      expect(newPairs?.defaultConfig.limit).toBe(20);
      expect(newPairs?.defaultConfig.autoRefresh).toBe(true);

      const trending = getWidgetDefinition('trending');
      expect(trending?.defaultConfig.limit).toBe(20);
      expect(trending?.defaultConfig.autoRefresh).toBe(true);
    });

    it('should have appropriate default configs for execution widgets', () => {
      const swap = getWidgetDefinition('swap');
      expect(swap?.defaultConfig.inputMint).toBe('So11111111111111111111111111111111111111112');
      expect(swap?.defaultConfig.slippageBps).toBe(100);
    });

    it('should have appropriate default configs for utility widgets', () => {
      const notes = getWidgetDefinition('notes');
      expect(notes?.defaultConfig.content).toBe('');

      const checklist = getWidgetDefinition('checklist');
      expect(checklist?.defaultConfig.items).toEqual([]);

      const pnlTracker = getWidgetDefinition('pnl-tracker');
      expect(pnlTracker?.defaultConfig.entries).toEqual([]);
    });

    it('should have appropriate default configs for alpha widgets', () => {
      const rssFeed = getWidgetDefinition('rss-feed');
      expect(rssFeed?.defaultConfig.feedUrl).toBeDefined();
      expect(rssFeed?.defaultConfig.limit).toBe(10);
      expect(rssFeed?.defaultConfig.autoRefresh).toBe(true);
    });
  });

  describe('Widget sizes', () => {
    it('should have reasonable default sizes', () => {
      Object.values(widgetRegistry).forEach((definition) => {
        // Default width should be between 250 and 1600
        expect(definition.defaultSize.width).toBeGreaterThanOrEqual(250);
        expect(definition.defaultSize.width).toBeLessThanOrEqual(1600);

        // Default height should be between 150 and 1200
        expect(definition.defaultSize.height).toBeGreaterThanOrEqual(150);
        expect(definition.defaultSize.height).toBeLessThanOrEqual(1200);
      });
    });

    it('should have reasonable minimum sizes', () => {
      Object.values(widgetRegistry).forEach((definition) => {
        // Min width should be at least 200
        expect(definition.minSize.width).toBeGreaterThanOrEqual(200);

        // Min height should be at least 100
        expect(definition.minSize.height).toBeGreaterThanOrEqual(100);
      });
    });

    it('should have chart widgets with larger default sizes', () => {
      const chartWidgets = ['dexscreener', 'dextools'];
      chartWidgets.forEach((type) => {
        const definition = getWidgetDefinition(type as WidgetType);
        expect(definition?.defaultSize.width).toBeGreaterThanOrEqual(800);
        expect(definition?.defaultSize.height).toBeGreaterThanOrEqual(600);
      });
    });

    it('should have utility widgets with smaller default sizes', () => {
      const utilityWidgets = ['block-clock', 'token-age'];
      utilityWidgets.forEach((type) => {
        const definition = getWidgetDefinition(type as WidgetType);
        expect(definition?.defaultSize.width).toBeLessThanOrEqual(400);
      });
    });
  });
});
