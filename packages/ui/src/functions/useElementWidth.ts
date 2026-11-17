import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Follows how wide an element's own box is as it is laid out and resized, measured before it is
 * first painted. Whatever overflows the box, such as a child placed past its edge, does not count.
 *
 * @returns A ref for the element, and its width in pixels, which is null until it has been measured.
 */
const useElementWidth = <Element extends HTMLElement>(): {
  ref: RefObject<Element | null>;
  width: number | null;
} => {
  const ref = useRef<Element | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (element === null || typeof ResizeObserver === 'undefined') {
      return;
    }

    setWidth(element.offsetWidth);

    const watching = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry !== undefined) {
        setWidth(entry.contentRect.width);
      }
    });

    watching.observe(element);

    return () => {
      watching.disconnect();
    };
  }, []);

  return { ref, width };
};

export { useElementWidth };
