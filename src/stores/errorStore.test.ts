import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useErrorStore } from './errorStore';
import { AppError, ErrorType } from '../utils/errorHandling';

describe('Error Store', () => {
  beforeEach(() => {
    // Reset store state
    useErrorStore.setState({ errors: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty errors array', () => {
    const { errors } = useErrorStore.getState();
    expect(errors).toEqual([]);
  });

  it('should add an error notification', () => {
    const { addError } = useErrorStore.getState();
    const error = new Error('Test error');

    addError(error);

    const { errors } = useErrorStore.getState();
    expect(errors).toHaveLength(1);
    expect(errors[0].error).toBe(error);
    expect(errors[0].id).toBeDefined();
    expect(errors[0].timestamp).toBeDefined();
  });

  it('should add multiple error notifications', () => {
    const { addError } = useErrorStore.getState();

    addError(new Error('Error 1'));
    addError(new Error('Error 2'));
    addError(new Error('Error 3'));

    const { errors } = useErrorStore.getState();
    expect(errors).toHaveLength(3);
  });

  it('should generate unique IDs for each error', () => {
    const { addError } = useErrorStore.getState();

    addError(new Error('Error 1'));
    addError(new Error('Error 2'));

    const { errors } = useErrorStore.getState();
    expect(errors[0].id).not.toBe(errors[1].id);
  });

  it('should remove an error notification by ID', () => {
    const { addError, removeError } = useErrorStore.getState();

    addError(new Error('Error 1'));
    addError(new Error('Error 2'));

    const { errors: initialErrors } = useErrorStore.getState();
    const firstErrorId = initialErrors[0].id;

    removeError(firstErrorId);

    const { errors: remainingErrors } = useErrorStore.getState();
    expect(remainingErrors).toHaveLength(1);
    expect(remainingErrors[0].id).not.toBe(firstErrorId);
  });

  it('should clear all error notifications', () => {
    const { addError, clearErrors } = useErrorStore.getState();

    addError(new Error('Error 1'));
    addError(new Error('Error 2'));
    addError(new Error('Error 3'));

    clearErrors();

    const { errors } = useErrorStore.getState();
    expect(errors).toHaveLength(0);
  });

  it('should auto-remove errors after 10 seconds', () => {
    const { addError } = useErrorStore.getState();

    addError(new Error('Test error'));

    const { errors: initialErrors } = useErrorStore.getState();
    expect(initialErrors).toHaveLength(1);

    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10000);

    const { errors: finalErrors } = useErrorStore.getState();
    expect(finalErrors).toHaveLength(0);
  });

  it('should handle AppError instances', () => {
    const { addError } = useErrorStore.getState();
    const error = new AppError('Test', ErrorType.NETWORK);

    addError(error);

    const { errors } = useErrorStore.getState();
    expect(errors[0].error).toBe(error);
  });

  it('should handle non-Error objects', () => {
    const { addError } = useErrorStore.getState();

    addError('String error');
    addError({ message: 'Object error' });
    addError(null);

    const { errors } = useErrorStore.getState();
    expect(errors).toHaveLength(3);
  });

  it('should maintain error order (FIFO)', () => {
    const { addError } = useErrorStore.getState();

    addError(new Error('First'));
    addError(new Error('Second'));
    addError(new Error('Third'));

    const { errors } = useErrorStore.getState();
    expect((errors[0].error as Error).message).toBe('First');
    expect((errors[1].error as Error).message).toBe('Second');
    expect((errors[2].error as Error).message).toBe('Third');
  });

  it('should not affect other errors when removing one', () => {
    const { addError, removeError } = useErrorStore.getState();

    addError(new Error('Error 1'));
    addError(new Error('Error 2'));
    addError(new Error('Error 3'));

    const { errors: initialErrors } = useErrorStore.getState();
    const middleErrorId = initialErrors[1].id;

    removeError(middleErrorId);

    const { errors: remainingErrors } = useErrorStore.getState();
    expect(remainingErrors).toHaveLength(2);
    expect((remainingErrors[0].error as Error).message).toBe('Error 1');
    expect((remainingErrors[1].error as Error).message).toBe('Error 3');
  });

  it('should handle removing non-existent error gracefully', () => {
    const { addError, removeError } = useErrorStore.getState();

    addError(new Error('Test error'));

    const { errors: initialErrors } = useErrorStore.getState();
    expect(initialErrors).toHaveLength(1);

    removeError('non-existent-id');

    const { errors: finalErrors } = useErrorStore.getState();
    expect(finalErrors).toHaveLength(1);
  });

  it('should set timestamp when adding error', () => {
    const { addError } = useErrorStore.getState();
    const beforeTime = Date.now();

    addError(new Error('Test error'));

    const { errors } = useErrorStore.getState();
    const afterTime = Date.now();

    expect(errors[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(errors[0].timestamp).toBeLessThanOrEqual(afterTime);
  });
});
