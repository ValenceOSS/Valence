import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Measures how wide something's content wants to be, and keeps measuring as it changes, so a space
 * can spring open to exactly that width. Animating to `auto` instead measures once, before the
 * content has settled, and lands short before snapping to the real width at the end.
 *
 * @param contentRef - The element whose content decides the width.
 * @returns The width in pixels, or null until it has been measured.
 */
const useFitWidth = (contentRef: RefObject<HTMLElement | null>): number | null => {
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (content === null) {
      return;
    }

    const measure = () => {
      setWidth(Math.ceil(content.scrollWidth));
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(content);

    for (const child of content.children) {
      observer.observe(child);
    }

    return () => {
      observer.disconnect();
    };
  }, [contentRef]);

  return width;
};

export { useFitWidth };
