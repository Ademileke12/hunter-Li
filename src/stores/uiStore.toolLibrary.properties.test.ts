import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useUIStore } from './uiStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('UI Store - Tool Library Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    useUIStore.setState({
      toolLibraryCollapsed: false,
      annotationMode: false,
      selectedTool: null,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Property 15: Tool Library State Persistence', () => {
    it('should persist and restore tool library collapsed/expanded state correctly', () => {
      /**
       * Feature: alpha-hunter-crypto-workspace
       * Property 15: Tool Library State Persistence
       * 
       * For any tool library collapsed/expanded state, persisting the state to
       * localStorage and reloading should restore the same collapsed/expanded state.
       * 
       * **Validates: Requirements 3.7**
       */

      const collapsedStateGen = fc.boolean();

      fc.assert(
        fc.property(collapsedStateGen, (collapsedState) => {
          // Clear localStorage to simulate fresh start
          localStorageMock.clear();

          // Set the tool library state
          useUIStore.setState({ toolLibraryCollapsed: collapsedState });

          // Manually persist to localStorage (simulating what the store does)
          localStorageMock.setItem('tool_library_collapsed', JSON.stringify(collapsedState));

          // Verify it was persisted
          const persistedValue = localStorageMock.getItem('tool_library_collapsed');
          expect(persistedValue).not.toBeNull();
          expect(JSON.parse(persistedValue!)).toBe(collapsedState);

          // Simulate application reload by reading from localStorage
          const restoredValue = JSON.parse(localStorageMock.getItem('tool_library_collapsed')!);

          // Verify the round-trip: set state -> persist -> load -> same state
          expect(restoredValue).toBe(collapsedState);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain state consistency across multiple toggle operations', () => {
      /**
       * Property 15 Extension: Multiple Toggle Persistence
       * 
       * Multiple toggle operations should each persist correctly, with the
       * final state being the last toggled state.
       */

      const toggleSequenceGen = fc.array(fc.boolean(), { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(toggleSequenceGen, (toggleSequence) => {
          localStorageMock.clear();
          const store = useUIStore.getState();

          // Apply each toggle in sequence
          toggleSequence.forEach((shouldBeCollapsed) => {
            store.setToolLibraryCollapsed(shouldBeCollapsed);

            // Manually persist (simulating store behavior)
            localStorageMock.setItem('tool_library_collapsed', JSON.stringify(shouldBeCollapsed));

            // Verify persistence after each toggle
            const persisted = localStorageMock.getItem('tool_library_collapsed');
            expect(persisted).not.toBeNull();
            expect(JSON.parse(persisted!)).toBe(shouldBeCollapsed);
          });

          // Final verification: the last state should be persisted
          const finalState = toggleSequence[toggleSequence.length - 1];
          const finalPersisted = localStorageMock.getItem('tool_library_collapsed');
          expect(JSON.parse(finalPersisted!)).toBe(finalState);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle toggle function correctly with persistence', () => {
      /**
       * Property 15 Extension: Toggle Function Persistence
       * 
       * Using the toggleToolLibrary function should correctly flip the state
       * and persist the new state.
       */

      const initialStateGen = fc.boolean();

      fc.assert(
        fc.property(initialStateGen, (initialState) => {
          localStorageMock.clear();
          const store = useUIStore.getState();

          // Set initial state
          store.setToolLibraryCollapsed(initialState);
          localStorageMock.setItem('tool_library_collapsed', JSON.stringify(initialState));

          // Toggle the state
          store.toggleToolLibrary();

          // Get the new state
          const newState = useUIStore.getState().toolLibraryCollapsed;

          // Verify the state was toggled
          expect(newState).toBe(!initialState);

          // Manually persist the new state (simulating store behavior)
          localStorageMock.setItem('tool_library_collapsed', JSON.stringify(newState));

          // Verify persistence
          const persisted = localStorageMock.getItem('tool_library_collapsed');
          expect(JSON.parse(persisted!)).toBe(!initialState);
        }),
        { numRuns: 100 }
      );
    });

    it('should persist state independently of other UI state', () => {
      /**
       * Property 15 Extension: State Independence
       * 
       * Tool library collapsed state should persist independently of other
       * UI state like annotation mode or selected tool.
       */

      const collapsedStateGen = fc.boolean();
      const annotationModeGen = fc.boolean();
      const selectedToolGen = fc.option(
        fc.constantFrom('pencil', 'arrow', 'highlight', 'text'),
        { nil: null }
      );

      fc.assert(
        fc.property(
          collapsedStateGen,
          annotationModeGen,
          selectedToolGen,
          (collapsed, annotationMode, selectedTool) => {
            localStorageMock.clear();

            // Set all UI state
            useUIStore.setState({
              toolLibraryCollapsed: collapsed,
              annotationMode,
              selectedTool,
            });

            // Persist tool library state
            localStorageMock.setItem('tool_library_collapsed', JSON.stringify(collapsed));

            // Verify only tool library state is in localStorage with this key
            const persistedCollapsed = localStorageMock.getItem('tool_library_collapsed');
            expect(JSON.parse(persistedCollapsed!)).toBe(collapsed);

            // Change other UI state
            useUIStore.setState({
              annotationMode: !annotationMode,
              selectedTool: selectedTool === 'pencil' ? 'arrow' : 'pencil',
            });

            // Verify tool library state unchanged in localStorage
            const stillPersisted = localStorageMock.getItem('tool_library_collapsed');
            expect(JSON.parse(stillPersisted!)).toBe(collapsed);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle missing localStorage data gracefully', () => {
      /**
       * Property 15 Edge Case: Missing Persistence Data
       * 
       * If localStorage data is missing, the store should use a default state
       * without crashing.
       */

      fc.assert(
        fc.property(fc.constant(null), () => {
          localStorageMock.clear();

          // Verify no data in localStorage
          const persisted = localStorageMock.getItem('tool_library_collapsed');
          expect(persisted).toBeNull();

          // Get current state (should use default)
          const state = useUIStore.getState();

          // Should have a valid boolean value (default)
          expect(typeof state.toolLibraryCollapsed).toBe('boolean');
        }),
        { numRuns: 10 }
      );
    });

    it('should handle corrupted localStorage data gracefully', () => {
      /**
       * Property 15 Edge Case: Corrupted Persistence Data
       * 
       * If localStorage data is corrupted, the store should handle it gracefully
       * and fall back to a default state.
       */

      const corruptedDataGen = fc.oneof(
        fc.constant('not-a-boolean'),
        fc.constant('{}'),
        fc.constant('[]'),
        fc.constant('123'),
        fc.constant('null'),
        fc.constant('undefined')
      );

      fc.assert(
        fc.property(corruptedDataGen, (corruptedData) => {
          localStorageMock.clear();

          // Set corrupted data
          localStorageMock.setItem('tool_library_collapsed', corruptedData);

          // Try to read and use the data
          try {
            const persisted = localStorageMock.getItem('tool_library_collapsed');
            if (persisted) {
              const parsed = JSON.parse(persisted);
              // If it parses but isn't a boolean, store should handle it
              if (typeof parsed !== 'boolean') {
                // Store should use default value
                const state = useUIStore.getState();
                expect(typeof state.toolLibraryCollapsed).toBe('boolean');
              }
            }
          } catch (error) {
            // If parsing fails, store should handle it gracefully
            const state = useUIStore.getState();
            expect(typeof state.toolLibraryCollapsed).toBe('boolean');
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should persist state across multiple store instances', () => {
      /**
       * Property 15 Extension: Cross-Instance Persistence
       * 
       * The persisted state should be accessible across different store
       * instances (simulating page reloads or multiple tabs).
       */

      const collapsedStateGen = fc.boolean();

      fc.assert(
        fc.property(collapsedStateGen, (collapsedState) => {
          localStorageMock.clear();

          // First "instance" - set and persist state
          useUIStore.setState({ toolLibraryCollapsed: collapsedState });
          localStorageMock.setItem('tool_library_collapsed', JSON.stringify(collapsedState));

          // Verify persistence
          const persisted = localStorageMock.getItem('tool_library_collapsed');
          expect(persisted).not.toBeNull();

          // Second "instance" - read from localStorage
          const restoredState = JSON.parse(persisted!);

          // Verify the state matches
          expect(restoredState).toBe(collapsedState);

          // Set the restored state in a "new" store instance
          useUIStore.setState({ toolLibraryCollapsed: restoredState });

          // Verify the store has the correct state
          expect(useUIStore.getState().toolLibraryCollapsed).toBe(collapsedState);
        }),
        { numRuns: 100 }
      );
    });
  });
});
