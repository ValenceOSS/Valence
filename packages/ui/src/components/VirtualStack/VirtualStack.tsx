import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@ValenceUI/cn';
import { scrollMarginIn } from '@ValenceUI/scrollMarginIn';
import { scrollerAbove } from '@ValenceUI/scrollerAbove';
import type { VirtualStackProps } from './VirtualStack.types';

const OVERSCAN = 4;

const DRAWN_BEFORE_MEASURED = 6;

/**
 * Stacks blocks of differing heights one above another and draws only those near the screen, however
 * many there are, so a page that goes on growing as somebody scrolls costs the same to draw at its
 * thousandth block as at its first. Each block is measured once drawn, so the space kept for those
 * out of sight is true to them and nothing jumps as they come and go.
 *
 * Scrolled by the window or by whatever panel it sits in, whichever moves it.
 *
 * @param count - How many blocks there are.
 * @param children - Draws one block.
 * @param keyOf - What each block is known by, so a block keeps its measure when others are added.
 * @param estimatedHeight - How tall a block is taken to be before it is measured.
 * @param gap - The space between blocks, in pixels.
 * @param className - Extra classes for the caller's own layout.
 */
const VirtualStack = ({
  count,
  children,
  keyOf,
  estimatedHeight,
  gap = 0,
  className,
}: VirtualStackProps) => {
  const laneRef = useRef<HTMLDivElement>(null);
  const keys = useRef(keyOf);

  useEffect(() => {
    keys.current = keyOf;
  });

  const keyAt = useCallback((index: number) => keys.current(index), []);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const lane = laneRef.current;

    if (lane === null) {
      return;
    }

    const above = scrollerAbove(lane);
    const scrolledBy = above === document.documentElement ? null : above;

    setScroller(scrolledBy);
    setScrollMargin(scrollMarginIn(lane, scrolledBy));

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const watching = new ResizeObserver(() => {
      setScrollMargin(scrollMarginIn(lane, scrolledBy));
    });

    watching.observe(document.body);

    return () => {
      watching.disconnect();
    };
  }, []);

  const sizing = {
    count,
    estimateSize: () => estimatedHeight + gap,
    getItemKey: keyAt,
    overscan: OVERSCAN,
    scrollMargin,
  };
  const inWindow = useWindowVirtualizer({ ...sizing, enabled: scroller === null });
  const inPanel = useVirtualizer({
    ...sizing,
    getScrollElement: () => scroller,
    enabled: scroller !== null,
  });
  const virtualiser = scroller === null ? inWindow : inPanel;
  const isMeasured = (virtualiser.scrollRect?.height ?? 0) > 0;
  const drawn = isMeasured
    ? virtualiser.getVirtualItems()
    : Array.from({ length: Math.min(count, DRAWN_BEFORE_MEASURED) }, (_, index) => ({
        key: keyOf(index),
        index,
        start: virtualiser.options.scrollMargin + index * (estimatedHeight + gap),
      }));

  return (
    <div ref={laneRef} className={cn('relative w-full', className)}>
      <div
        className="relative w-full"
        style={{ height: `${virtualiser.getTotalSize().toString()}px` }}
      >
        {drawn.map((block) => (
          <div
            key={block.key}
            ref={isMeasured ? virtualiser.measureElement : undefined}
            data-index={block.index}
            className="absolute inset-x-0 top-0"
            style={{
              paddingBottom: `${gap.toString()}px`,
              transform: `translateY(${(block.start - virtualiser.options.scrollMargin).toString()}px)`,
            }}
          >
            {children(block.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

VirtualStack.displayName = 'VirtualStack';

export { VirtualStack };
