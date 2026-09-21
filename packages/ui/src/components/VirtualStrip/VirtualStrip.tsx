import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@ValenceUI/cn';
import type { VirtualStripProps } from './VirtualStrip.types';

const OVERSCAN = 4;

/**
 * A long run of things of different heights, stacked and scrolled, of which only the ones near the
 * screen exist — a chapter of a hundred pictures is a hundred boxes of the right size, and the few
 * in view and just beyond it hold anything. Each is measured as it is drawn, so the strip is the
 * height it turns out to be rather than the one guessed for it, and what is above the screen can
 * change size without moving what is on it.
 *
 * Says which one is across the middle of the screen as it scrolls, which is the one somebody is up
 * to, and can begin part way down.
 *
 * @param label - What the strip holds, read out to anybody who cannot see it.
 * @param count - How many things there are.
 * @param estimateSize - How tall to take one to be until it has been drawn, in pixels.
 * @param startAtIndex - Which to begin at, for somebody coming back.
 * @param onIndexChange - Told the one across the middle of the screen when it changes.
 * @param onClick - Called when the strip is pressed.
 * @param footer - What follows the last one, at the foot of the strip.
 * @param children - Draws one, given its place in the run.
 * @param className - Extra classes for the caller's own layout.
 */
const VirtualStrip = ({
  label,
  count,
  estimateSize,
  startAtIndex = 0,
  onIndexChange,
  onClick,
  footer,
  children,
  className,
}: VirtualStripProps) => {
  const scroller = useRef<HTMLDivElement>(null);
  const report = useRef(onIndexChange);

  const virtualiser = useVirtualizer({
    count,
    getScrollElement: () => scroller.current,
    estimateSize: () => estimateSize,
    overscan: OVERSCAN,
  });

  useEffect(() => {
    report.current = onIndexChange;
  });

  useEffect(() => {
    if (startAtIndex > 0) {
      virtualiser.scrollToIndex(Math.min(startAtIndex, count - 1), { align: 'start' });
    }
  }, [count, startAtIndex]);

  const middle = (virtualiser.scrollOffset ?? 0) + (virtualiser.scrollRect?.height ?? 0) / 2;
  const across = virtualiser
    .getVirtualItems()
    .find((item) => item.start <= middle && middle < item.end)?.index;

  useEffect(() => {
    if (across !== undefined) {
      report.current?.(across);
    }
  }, [across]);

  return (
    <div
      ref={scroller}
      aria-label={label}
      role="presentation"
      onClick={onClick}
      className={cn('valence-rail h-full w-full overflow-y-auto', className)}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualiser.getTotalSize().toString()}px` }}
      >
        {virtualiser.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualiser.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${item.start.toString()}px)` }}
          >
            {children(item.index)}
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
};

VirtualStrip.displayName = 'VirtualStrip';

export { VirtualStrip };
