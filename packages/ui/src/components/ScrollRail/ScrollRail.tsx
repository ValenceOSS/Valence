import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import type { PointerEvent } from 'react';
import type { ScrollRailProps } from './ScrollRail.types';

/**
 * A row that scrolls sideways, with a track beneath it that stays in view rather than fading when
 * left alone, so it can be dragged or clicked without a trackpad. The track is slim at rest, a
 * little thicker under the pointer, and thick while its thumb is held, so a drag is felt to take. A
 * mouse wheel turned over the row scrolls it sideways, and a control in it moved to with the
 * keyboard is brought into view.
 *
 * @param children - What the row holds.
 * @param className - How the row lays out what it holds.
 * @param isDisabled - Whether the row is held still, its track drawn faintly and taking no pointer,
 *   while what it holds cannot be used.
 */
const ScrollRail = ({ children, className, isDisabled = false }: ScrollRailProps) => {
  const row = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const held = useRef<number | null>(null);
  const [view, setView] = useState({ share: 1, along: 0 });
  const [isHeld, setIsHeld] = useState(false);

  const measure = () => {
    const element = row.current;

    if (element === null) {
      return;
    }

    const room = element.scrollWidth - element.clientWidth;

    setView({
      share: element.scrollWidth === 0 ? 1 : Math.min(1, element.clientWidth / element.scrollWidth),
      along: room <= 0 ? 0 : element.scrollLeft / room,
    });
  };

  useLayoutEffect(() => {
    const element = row.current;

    measure();

    if (element === null || typeof ResizeObserver === 'undefined') {
      return;
    }

    const watching = new ResizeObserver(measure);

    watching.observe(element);

    return () => {
      watching.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = row.current;

    if (element === null || isDisabled) {
      return;
    }

    const wheel = (event: WheelEvent) => {
      const room = element.scrollWidth - element.clientWidth;

      if (room <= 0 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      const next = Math.min(Math.max(element.scrollLeft + event.deltaY, 0), room);

      if (next !== element.scrollLeft) {
        event.preventDefault();
        element.scrollLeft = next;
      }
    };

    element.addEventListener('wheel', wheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', wheel);
    };
  }, [isDisabled]);

  const scrollBy = (pixels: number) => {
    const element = row.current;

    if (element !== null) {
      element.scrollLeft += pixels;
    }
  };

  const grab = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    held.current = event.clientX;
    setIsHeld(true);
  };

  const letGo = () => {
    held.current = null;
    setIsHeld(false);
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const was = held.current;
    const element = row.current;
    const width = track.current?.clientWidth ?? 0;

    if (was === null || element === null || width === 0) {
      return;
    }

    held.current = event.clientX;
    scrollBy(((event.clientX - was) * element.scrollWidth) / width);
  };

  const jump = (event: PointerEvent<HTMLDivElement>) => {
    const element = row.current;
    const bounds = track.current?.getBoundingClientRect();

    if (element === null || bounds === undefined || bounds.width === 0) {
      return;
    }

    const thumbStart = bounds.left + view.along * (1 - view.share) * bounds.width;

    scrollBy(event.clientX < thumbStart ? -element.clientWidth : element.clientWidth);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={row}
        className={cn(
          'valence-rail',
          isDisabled ? 'overflow-x-hidden' : 'overflow-x-auto',
          className,
        )}
        onScroll={measure}
      >
        {children}
      </div>

      {view.share >= 1 ? null : (
        <div
          ref={track}
          aria-hidden
          className="group flex h-2.5 items-center"
          onPointerDown={isDisabled ? undefined : jump}
        >
          <div
            className={cn(
              'relative w-full rounded-full bg-text/10 transition-[height] duration-150 ease-out still:transition-none',
              isDisabled ? 'h-1' : isHeld ? 'h-2.5' : 'h-1 group-hover:h-1.5',
            )}
          >
            <div
              className={cn(
                'absolute inset-y-0 rounded-full transition-colors',
                isDisabled
                  ? 'pointer-events-none bg-text/15'
                  : isHeld
                    ? 'bg-text/60'
                    : 'bg-text/35 hover:bg-text/50',
              )}
              style={{
                width: `${(view.share * 100).toFixed(3)}%`,
                left: `${(view.along * (1 - view.share) * 100).toFixed(3)}%`,
              }}
              onPointerDown={grab}
              onPointerMove={drag}
              onPointerUp={letGo}
              onPointerCancel={letGo}
            />
          </div>
        </div>
      )}
    </div>
  );
};

ScrollRail.displayName = 'ScrollRail';

export { ScrollRail };
