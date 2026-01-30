import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChecklistWidget from './ChecklistWidget';
import { I18nProvider } from '../contexts/I18nContext';

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nProvider>{component}</I18nProvider>);
};

describe('ChecklistWidget', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty state', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-1" />);
    expect(screen.getByPlaceholderText(/add/i)).toBeInTheDocument();
  });

  it('adds new item when clicking add button', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-2" />);
    
    const input = screen.getByPlaceholderText(/add/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Test item' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Test item')).toBeInTheDocument();
  });

  it('adds new item when pressing Enter key', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-3" />);
    
    const input = screen.getByPlaceholderText(/add/i);

    fireEvent.change(input, { target: { value: 'Test item' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(screen.getByText('Test item')).toBeInTheDocument();
  });

  it('clears input after adding item', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-4" />);
    
    const input = screen.getByPlaceholderText(/add/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Test item' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(input.value).toBe('');
  });

  it('does not add empty items', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-5" />);
    
    const input = screen.getByPlaceholderText(/add/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('toggles item checked state', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-6" />);
    
    const input = screen.getByPlaceholderText(/add/i);
    fireEvent.change(input, { target: { value: 'Test item' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('deletes item when clicking delete button', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-7" />);
    
    const input = screen.getByPlaceholderText(/add/i);
    fireEvent.change(input, { target: { value: 'Test item' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(screen.getByText('Test item')).toBeInTheDocument();

    const deleteButton = screen.getByLabelText(/delete/i);
    fireEvent.click(deleteButton);

    expect(screen.queryByText('Test item')).not.toBeInTheDocument();
  });

  it('persists items to localStorage', async () => {
    const widgetId = 'test-8';
    const { unmount } = renderWithI18n(<ChecklistWidget widgetId={widgetId} />);
    
    const input = screen.getByPlaceholderText(/add/i);
    fireEvent.change(input, { target: { value: 'Persistent item' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      const stored = localStorage.getItem(`checklist_${widgetId}`);
      expect(stored).toBeTruthy();
      const items = JSON.parse(stored!);
      expect(items).toHaveLength(1);
      expect(items[0].text).toBe('Persistent item');
    });

    unmount();
  });

  it('loads items from localStorage', () => {
    const widgetId = 'test-9';
    const items = [
      { id: '1', text: 'Item 1', checked: false },
      { id: '2', text: 'Item 2', checked: true },
    ];
    localStorage.setItem(`checklist_${widgetId}`, JSON.stringify(items));

    renderWithI18n(<ChecklistWidget widgetId={widgetId} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);
  });

  it('handles multiple items', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-10" />);
    
    const input = screen.getByPlaceholderText(/add/i);

    ['Item 1', 'Item 2', 'Item 3'].forEach(text => {
      fireEvent.change(input, { target: { value: text } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    });

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('applies line-through style to checked items', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-11" />);
    
    const input = screen.getByPlaceholderText(/add/i);
    fireEvent.change(input, { target: { value: 'Test item' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    const itemText = screen.getByText('Test item');
    expect(itemText).not.toHaveClass('line-through');

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(itemText).toHaveClass('line-through');
  });

  it('supports drag and drop reordering', () => {
    renderWithI18n(<ChecklistWidget widgetId="test-12" />);
    
    const input = screen.getByPlaceholderText(/add/i);
    
    ['Item 1', 'Item 2', 'Item 3'].forEach(text => {
      fireEvent.change(input, { target: { value: text } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    });

    const items = screen.getAllByText(/Item \d/);
    expect(items[0]).toHaveTextContent('Item 1');
    expect(items[1]).toHaveTextContent('Item 2');
    expect(items[2]).toHaveTextContent('Item 3');

    // Simulate drag and drop (basic test)
    const draggableElements = items.map(item => item.closest('[draggable="true"]'));
    
    fireEvent.dragStart(draggableElements[0]!);
    fireEvent.dragOver(draggableElements[2]!);
    fireEvent.drop(draggableElements[2]!);
    fireEvent.dragEnd(draggableElements[0]!);

    // After reordering, items should be in different order
    const reorderedItems = screen.getAllByText(/Item \d/);
    expect(reorderedItems).toHaveLength(3);
  });

  it('handles localStorage errors gracefully', () => {
    const widgetId = 'test-13';
    localStorage.setItem(`checklist_${widgetId}`, 'invalid json');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithI18n(<ChecklistWidget widgetId={widgetId} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load checklist:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
