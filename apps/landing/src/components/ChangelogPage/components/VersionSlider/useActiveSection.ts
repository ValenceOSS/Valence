import { useEffect, useState } from 'react';

const READING_BAND = '-45% 0px -45% 0px';

/**
 * Watches a set of elements named by id and reports whichever one sits in a thin band through the
 * middle of the viewport, so a page can say which of its own sections the reader is actually
 * reading right now rather than which merely takes up the most space on screen — a tall section
 * would win that measure the entire time it's on screen, long before it's what's being read.
 *
 * @param ids - The elements to watch, in the order they appear on the page.
 * @returns The one currently in the reading band, or the first id before anything has been
 *   measured yet.
 */
const useActiveSection = (ids: string[]): string | null => {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || ids.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const inBand = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (inBand !== undefined) {
          setActiveId(inBand.target.id);
        }
      },
      { rootMargin: READING_BAND, threshold: [0, 0.5, 1] },
    );

    for (const id of ids) {
      const element = document.getElementById(id);

      if (element !== null) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [ids]);

  return activeId;
};

export { useActiveSection };
