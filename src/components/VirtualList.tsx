import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { calculateVirtualScroll } from '../utils/renderOptimizations';
import { rafThrottle } from '../utils/performance';

/**
 * Virtual List Component
 * 
 * Renders only visible items in a long list for optimal performance.
 * Useful for lists with 50+ items.
 * 
 * Features:
 * - Only renders visible items + overscan
 * - Smooth scrolling with RAF throttling
 * - Automatic height calculation
 * - Memory efficient
 * 
 * Requirements: 18.7
 */

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

function VirtualListComponent<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const { startIndex, endIndex, offsetY, totalHeight } = calculateVirtualScroll(
    scrollTop,
    items.length,
    { itemHeight, containerHeight, overscan }
  );

  // Throttled scroll handler
  const handleScroll = useCallback(
    rafThrottle((e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);
    }),
    []
  );

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const VirtualList = memo(VirtualListComponent) as typeof VirtualListComponent;

VirtualList.displayName = 'VirtualList';

/**
 * Example usage:
 * 
 * <VirtualList
 *   items={holders}
 *   itemHeight={60}
 *   containerHeight={400}
 *   overscan={5}
 *   renderItem={(holder, index) => (
 *     <HolderRow holder={holder} index={index} />
 *   )}
 * />
 */
