import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonLoader, SkeletonCard, SkeletonTable } from './SkeletonLoader';

describe('SkeletonLoader', () => {
  it('should render without crashing', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container).toBeInTheDocument();
  });

  it('should render multiple skeleton items', () => {
    const { container } = render(<SkeletonLoader />);
    const skeletonItems = container.querySelectorAll('.skeleton-item');
    
    // Should have multiple skeleton elements
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  it('should apply shimmer animation', () => {
    const { container } = render(<SkeletonLoader />);
    const skeletonItem = container.querySelector('.skeleton-item');
    
    // Should have animation style
    const animationValue = (skeletonItem as HTMLElement)?.style.animation;
    expect(animationValue).toContain('shimmer');
  });

  it('should have gradient background', () => {
    const { container } = render(<SkeletonLoader />);
    const skeletonItem = container.querySelector('.skeleton-item');
    
    // Should have gradient background
    const backgroundValue = (skeletonItem as HTMLElement)?.style.background;
    expect(backgroundValue).toContain('linear-gradient');
  });

  it('should have staggered animation delays', () => {
    const { container } = render(<SkeletonLoader />);
    const skeletonItems = container.querySelectorAll('.skeleton-item');
    
    // Check that different items have different animation delays
    const delays = Array.from(skeletonItems).map(item => 
      (item as HTMLElement).style.animationDelay
    );
    
    // Should have at least some different delays
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('should fill container height', () => {
    const { container } = render(<SkeletonLoader />);
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).toHaveStyle({ 
      width: '100%',
      height: '100%' 
    });
  });

  it('should have rounded corners', () => {
    const { container } = render(<SkeletonLoader />);
    const skeletonItem = container.querySelector('.skeleton-item');
    
    expect(skeletonItem).toHaveStyle({ borderRadius: '6px' });
  });
});

describe('SkeletonCard', () => {
  it('should render card skeleton', () => {
    const { container } = render(<SkeletonCard />);
    expect(container).toBeInTheDocument();
  });

  it('should have card styling', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;
    
    const borderRadius = card.style.borderRadius;
    const background = card.style.background;
    
    expect(borderRadius).toBe('8px');
    expect(background).toContain('rgba');
  });

  it('should render multiple skeleton lines', () => {
    const { container } = render(<SkeletonCard />);
    const skeletonLines = container.querySelectorAll('div[style*="linear-gradient"]');
    
    // Should have at least 2 lines
    expect(skeletonLines.length).toBeGreaterThanOrEqual(2);
  });
});

describe('SkeletonTable', () => {
  it('should render table skeleton with default rows', () => {
    const { container } = render(<SkeletonTable />);
    expect(container).toBeInTheDocument();
  });

  it('should render specified number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} />);
    
    // Count the number of row containers (excluding header)
    const rows = container.querySelectorAll('div[style*="display: flex"]');
    
    // Should have header + specified rows
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should render table header', () => {
    const { container } = render(<SkeletonTable />);
    
    // Header should have border-bottom
    const header = container.querySelector('div[style*="border-bottom"]');
    expect(header).toBeInTheDocument();
  });

  it('should render multiple columns per row', () => {
    const { container } = render(<SkeletonTable rows={1} />);
    
    // Each row should have multiple columns (flex items)
    const firstRow = container.querySelectorAll('div[style*="display: flex"]')[1];
    const columns = firstRow?.querySelectorAll('div[style*="flex: 1"]');
    
    expect(columns?.length).toBeGreaterThan(1);
  });

  it('should apply shimmer animation to all cells', () => {
    const { container } = render(<SkeletonTable rows={2} />);
    
    const cells = container.querySelectorAll('div[style*="shimmer"]');
    
    // Should have multiple animated cells
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should have staggered animation for table cells', () => {
    const { container } = render(<SkeletonTable rows={2} />);
    
    const cells = Array.from(container.querySelectorAll('div[style*="linear-gradient"]'));
    const delays = cells.map(cell => (cell as HTMLElement).style.animationDelay);
    
    // Should have different delays
    const uniqueDelays = new Set(delays.filter(d => d));
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

describe('SkeletonLoader animations', () => {
  it('should define shimmer keyframes', () => {
    const { container } = render(<SkeletonLoader />);
    
    // Check if style tag with keyframes exists
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain('@keyframes shimmer');
  });

  it('should animate background position', () => {
    const { container } = render(<SkeletonLoader />);
    
    const styleTag = container.querySelector('style');
    expect(styleTag?.textContent).toContain('background-position');
  });

  it('should have smooth animation duration', () => {
    const { container } = render(<SkeletonLoader />);
    const skeletonItem = container.querySelector('.skeleton-item');
    
    // Should have 1.5s animation
    const animationValue = (skeletonItem as HTMLElement)?.style.animation;
    expect(animationValue).toContain('1.5s');
  });
});
