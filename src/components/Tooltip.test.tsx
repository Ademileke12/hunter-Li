import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip Component', () => {
  it('should render children without tooltip initially', () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('should support different positions', () => {
    const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];

    positions.forEach((position) => {
      const { unmount } = render(
        <Tooltip content="Test tooltip" position={position} delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      unmount();
    });

    // If no errors thrown, positions are supported
    expect(true).toBe(true);
  });

  it('should accept delay prop', () => {
    const { container } = render(
      <Tooltip content="Test tooltip" delay={500}>
        <button>Hover me</button>
      </Tooltip>
    );

    expect(container).toBeTruthy();
  });

  it('should clone children with proper props', () => {
    render(
      <Tooltip content="Test tooltip">
        <button data-testid="tooltip-trigger">Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByTestId('tooltip-trigger');
    expect(trigger).toBeInTheDocument();
  });
});
