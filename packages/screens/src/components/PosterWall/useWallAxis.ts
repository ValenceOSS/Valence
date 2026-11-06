import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MotionValue } from 'motion/react';

const ORIGIN = 4096;

/**
 * Which rows, or which columns, of the wall are near enough the screen to be drawn, worked out by a
 * virtualizer that is told where the wall has been moved to rather than reading a scroll position,
 * since the wall is dragged and thrown rather than scrolled. It counts from far enough back that
 * the wall can be moved any distance anybody would in either direction.
 *
 * @param field - The element the wall is drawn in.
 * @param pan - Where the wall has been moved to along this axis.
 * @param step - How far apart one row or column is from the next.
 * @param reach - How far either side of the middle a poster can be and still show.
 * @param isAcross - Whether this is the columns rather than the rows.
 * @returns The rows or columns to draw, counted from the first.
 */
const useWallAxis = (
  field: RefObject<HTMLElement | null>,
  pan: MotionValue<number>,
  step: number,
  reach: number,
  isAcross: boolean,
): number[] => {
  const geometry = useRef({ step, reach });
  const tellOffset = useRef<((offset: number, isScrolling: boolean) => void) | null>(null);
  const tellSize = useRef<((rect: { width: number; height: number }) => void) | null>(null);

  const axis = useVirtualizer({
    count: ORIGIN * 2,
    horizontal: isAcross,
    getScrollElement: () => field.current,
    estimateSize: () => step,
    overscan: 1,
    scrollToFn: () => undefined,
    observeElementRect: (_virtualizer, tell) => {
      const span = geometry.current.reach * 2;

      tellSize.current = tell;
      tell({ width: span, height: span });

      return () => {
        tellSize.current = null;
      };
    },
    observeElementOffset: (_virtualizer, tell) => {
      const offsetAt = (at: number) => at - geometry.current.reach + ORIGIN * geometry.current.step;

      tellOffset.current = tell;
      tell(offsetAt(pan.get()), false);

      return pan.on('change', (at) => {
        tell(offsetAt(at), false);
      });
    },
  });

  useEffect(() => {
    geometry.current = { step, reach };
    axis.measure();
    tellSize.current?.({ width: reach * 2, height: reach * 2 });
    tellOffset.current?.(pan.get() - reach + ORIGIN * step, false);
  }, [axis, pan, reach, step]);

  return axis.getVirtualItems().map((item) => item.index - ORIGIN);
};

export { useWallAxis };
