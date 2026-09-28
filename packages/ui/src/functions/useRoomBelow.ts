import { useLayoutEffect, useState } from 'react';
import { scrollerAbove } from '@ValenceUI/scrollerAbove';
import type { RefObject } from 'react';

const LEAST = 240;

/**
 * How tall a box can stand for everything around it to fit in what scrolls it without scrolling:
 * from its top to the foot of the scrolling area, less whatever of the page sits below it. What
 * sits below is read from where the page's content ends rather than from how far it scrolls, since
 * a page shorter than its window scrolls exactly as far as the window is tall. Measured again
 * whenever the window or what scrolls changes size, and never less than a usable height, so a short
 * window scrolls the page rather than squashing the box to nothing.
 *
 * @param box - The box to size.
 * @param isOn - Whether to measure at all.
 * @returns The height it can take, in pixels, or null before it has been measured or when off.
 */
const useRoomBelow = (box: RefObject<HTMLElement | null>, isOn: boolean): number | null => {
  const [room, setRoom] = useState<number | null>(null);

  useLayoutEffect(() => {
    const measured = box.current;

    if (!isOn || measured === null) {
      return undefined;
    }

    const scroller = scrollerAbove(measured);
    const isWindow = scroller === document.documentElement;

    const measure = () => {
      const bottom = isWindow
        ? window.innerHeight
        : scroller.getBoundingClientRect().top + scroller.clientHeight;
      const edges = measured.getBoundingClientRect();
      const lowest = Math.max(
        edges.bottom,
        ...[...scroller.children].map((child) => child.getBoundingClientRect().bottom),
      );
      const padding = Number.parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
      const below = lowest + padding - edges.bottom;

      const scrolled = isWindow ? window.scrollY : scroller.scrollTop;

      setRoom(Math.max(LEAST, Math.floor(bottom - (edges.top + scrolled) - below)));
    };

    measure();

    const watcher = new ResizeObserver(measure);

    watcher.observe(scroller);

    if (scroller.firstElementChild !== null) {
      watcher.observe(scroller.firstElementChild);
    }

    window.addEventListener('resize', measure);

    return () => {
      watcher.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [box, isOn]);

  return isOn ? room : null;
};

export { useRoomBelow };
