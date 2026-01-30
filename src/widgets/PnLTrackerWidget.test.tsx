import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PnLTrackerWidget from './PnLTrackerWidget';
import { I18nProvider } from '../contexts/I18nContext';

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nProvider>{component}</I18nProvider>);
};

describe('PnLTrackerWidget', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders with add button', () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-1" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens modal when clicking add button', () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-2" />);
    
    const addButton = screen.getAllByRole('button')[0];
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText(/SOL, USDC/i)).toBeInTheDocument();
  });

  it('adds new entry with correct PnL calculation', async () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-3" />);
    
    fireEvent.click(screen.getAllByRole('button')[0]);

    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'SOL' },
    });
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '150' } });
    fireEvent.change(inputs[2], { target: { value: '10' } });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]); // Submit button

    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
      const pnlElements = screen.getAllByText(/500\.00/);
      expect(pnlElements.length).toBeGreaterThan(0); // (150-100)*10 = 500
    });
  });

  it('calculates negative PnL correctly', async () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-4" />);
    
    fireEvent.click(screen.getAllByRole('button')[0]);

    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'USDC' },
    });
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '200' } });
    fireEvent.change(inputs[1], { target: { value: '150' } });
    fireEvent.change(inputs[2], { target: { value: '5' } });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      const pnlElements = screen.getAllByText(/-250\.00/);
      expect(pnlElements.length).toBeGreaterThan(0); // (150-200)*5 = -250
    });
  });

  it('displays total PnL', async () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-5" />);
    
    // Add first entry (profit)
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'SOL' },
    });
    let inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '150' } });
    fireEvent.change(inputs[2], { target: { value: '10' } });
    let buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
    });

    // Add second entry (loss)
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'USDC' },
    });
    inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '200' } });
    fireEvent.change(inputs[1], { target: { value: '180' } });
    fireEvent.change(inputs[2], { target: { value: '5' } });
    buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      // Total: 500 + (-100) = 400
      const totalElements = screen.getAllByText(/400\.00/);
      expect(totalElements.length).toBeGreaterThan(0);
    });
  });

  it('deletes entry', async () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-6" />);
    
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'SOL' },
    });
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '150' } });
    fireEvent.change(inputs[2], { target: { value: '10' } });
    let buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('SOL')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('✕');
    fireEvent.click(deleteButton);

    expect(screen.queryByText('SOL')).not.toBeInTheDocument();
  });

  it('persists entries to localStorage', async () => {
    const widgetId = 'test-7';
    const { unmount } = renderWithI18n(<PnLTrackerWidget widgetId={widgetId} />);
    
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'SOL' },
    });
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '150' } });
    fireEvent.change(inputs[2], { target: { value: '10' } });
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      const stored = localStorage.getItem(`pnl_tracker_${widgetId}`);
      expect(stored).toBeTruthy();
      const entries = JSON.parse(stored!);
      expect(entries).toHaveLength(1);
      expect(entries[0].token).toBe('SOL');
      expect(entries[0].pnl).toBe(500);
    });

    unmount();
  });

  it('loads entries from localStorage', () => {
    const widgetId = 'test-8';
    const entries = [
      {
        id: '1',
        token: 'SOL',
        entryPrice: 100,
        exitPrice: 150,
        amount: 10,
        pnl: 500,
        timestamp: Date.now(),
      },
    ];
    localStorage.setItem(`pnl_tracker_${widgetId}`, JSON.stringify(entries));

    renderWithI18n(<PnLTrackerWidget widgetId={widgetId} />);

    expect(screen.getByText('SOL')).toBeInTheDocument();
    const pnlElements = screen.getAllByText(/500\.00/);
    expect(pnlElements.length).toBeGreaterThan(0);
  });

  it('closes modal when clicking cancel', () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-9" />);
    
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByPlaceholderText(/SOL, USDC/i)).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 2]); // Cancel button
    expect(screen.queryByPlaceholderText(/SOL, USDC/i)).not.toBeInTheDocument();
  });

  it('applies correct color to positive PnL', async () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-10" />);
    
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'SOL' },
    });
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '150' } });
    fireEvent.change(inputs[2], { target: { value: '10' } });
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      const pnlElements = screen.getAllByText(/500\.00/);
      const pnlElement = pnlElements.find(el => el.classList.contains('text-green-400'));
      expect(pnlElement).toBeTruthy();
    });
  });

  it('applies correct color to negative PnL', async () => {
    renderWithI18n(<PnLTrackerWidget widgetId="test-11" />);
    
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(screen.getByPlaceholderText(/SOL, USDC/i), {
      target: { value: 'SOL' },
    });
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '150' } });
    fireEvent.change(inputs[1], { target: { value: '100' } });
    fireEvent.change(inputs[2], { target: { value: '10' } });
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      const pnlElements = screen.getAllByText(/-500\.00/);
      const pnlElement = pnlElements.find(el => el.classList.contains('text-red-400'));
      expect(pnlElement).toBeTruthy();
    });
  });
});
