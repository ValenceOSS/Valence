import { useEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@ValenceUI/cn';
import { columnsIn } from '@ValenceUI/columnsIn';
import type { VirtualGridProps } from './VirtualGrid.types';

const OVERSCAN_ROWS = 2;

/**
 * A grid that draws only the rows on screen, however many things it is given — the rest are room
 * kept open above and below, so a list of thousands costs the browser a screenful.
 *
 * It measures rather than guesses: how wide it is decides how many fit across, and each row is
 * measured as it is drawn, so a row of cards whose titles wrap to two lines pushes the rest down by
 * exactly as much as it should. It rides the window's own scroll, since that is what the pages
 * scroll and what the browser puts back where it was.
 *
 * @param count - How many things there are.
 * @param children - Draws the thing at an index.
 * @param leastCardWidth - The narrowest a card may be drawn, which decides how many fit across.
 * @param rowHeight - What a row is worth before it has been measured.
 * @param gap - The room between two cards, across and down.
 * @param label - What the grid holds, for anybody who cannot see it.
 * @param className - Extra classes for the caller's own layout.
 */
const VirtualGrid = ({
  count,
  children,
  leastCardWidth,
  rowHeight,
  gap = 16,
  label,
  className,
}: VirtualGridProps) => {
  const laneRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const lane = laneRef.current;

    if (lane === null) {
      return;
    }

    setWidth(lane.clientWidth);
    setScrollMargin(lane.offsetTop);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const watching = new ResizeObserver(([entry]) => {
      setWidth(entry?.contentRect.width ?? lane.clientWidth);
      setScrollMargin(lane.offsetTop);
    });

    watching.observe(lane);

    return () => {
      watching.disconnect();
    };
  }, []);

  const columns = columnsIn(width, leastCardWidth, gap);
  const rows = Math.ceil(count / columns);

  const virtualiser = useWindowVirtualizer({
    count: rows,
    estimateSize: () => rowHeight + gap,
    overscan: OVERSCAN_ROWS,
    scrollMargin,
  });

  return (
    <div ref={laneRef} className={cn('relative w-full', className)} aria-label={label}>
      <div
        className="relative w-full"
        style={{ height: `${virtualiser.getTotalSize().toString()}px` }}
      >
        {virtualiser.getVirtualItems().map((row) => (
          <div
            key={row.key}
            ref={virtualiser.measureElement}
            data-index={row.index}
            className="absolute inset-x-0 top-0 grid"
            style={{
              gap: `${gap.toString()}px`,
              gridTemplateColumns: `repeat(${columns.toString()}, minmax(0, 1fr))`,
              paddingBottom: `${gap.toString()}px`,
              transform: `translateY(${(row.start - virtualiser.options.scrollMargin).toString()}px)`,
            }}
          >
            {Array.from({ length: columns }, (_, column) => row.index * columns + column)
              .filter((at) => at < count)
              .map((at) => children(at))}
          </div>
        ))}
      </div>
    </div>
  );
};

VirtualGrid.displayName = 'VirtualGrid';

export { VirtualGrid };
