/**
 * Error Store
 * 
 * Global state management for error notifications.
 * Provides methods to add, remove, and clear error notifications.
 * 
 * Requirements: 19.7
 */

import { create } from 'zustand';

export interface ErrorNotification {
  id: string;
  error: unknown;
  timestamp: number;
}

interface ErrorStore {
  errors: ErrorNotification[];
  addError: (error: unknown) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

/**
 * Error Store
 * 
 * Manages error notifications globally across the application.
 */
export const useErrorStore = create<ErrorStore>((set) => ({
  errors: [],

  /**
   * Add an error notification
   * @param error - Error to display
   */
  addError: (error: unknown) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: ErrorNotification = {
      id,
      error,
      timestamp: Date.now(),
    };

    set((state) => ({
      errors: [...state.errors, notification],
    }));

    // Auto-remove after 10 seconds as fallback
    setTimeout(() => {
      set((state) => ({
        errors: state.errors.filter((e) => e.id !== id),
      }));
    }, 10000);
  },

  /**
   * Remove an error notification by ID
   * @param id - Error notification ID
   */
  removeError: (id: string) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }));
  },

  /**
   * Clear all error notifications
   */
  clearErrors: () => {
    set({ errors: [] });
  },
}));
