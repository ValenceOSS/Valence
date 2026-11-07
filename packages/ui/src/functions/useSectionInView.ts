import { useEffect, useState } from 'react';

const READ_LINE = 0.2;

const READ_BAND = `-${(READ_LINE * 100).toString()}% 0px -70% 0px`;

/**
 * Which of a page's sections is being read: the one crossing a band a little below the top of the
 * window, the way an eye settles on a page; between sections, the last one whose top has passed it,
 * and the first of them before any has.
 * Followed as the page scrolls, by whatever scrolls it.
 *
 * @param ids - The sections' element ids, in the order they come down the page.
 * @returns The id of the section being read, or null where there are none.
 */
const useSectionInView = (ids: readonly string[]): string | null => {
  const key = ids.join('\n');
  const [inView, setInView] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const sections = key
      .split('\n')
      .map((id) => document.getElementById(id))
      .filter((section) => section !== null);

    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const crossing = new Set<string>();
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            crossing.add(entry.target.id);
          } else {
            crossing.delete(entry.target.id);
          }
        }

        const first = sections.find((section) => crossing.has(section.id));
        const line = window.innerHeight * READ_LINE;
        const passed = sections.filter((section) => section.getBoundingClientRect().top < line);

        setInView((first ?? passed.at(-1) ?? sections[0])?.id ?? null);
      },
      { rootMargin: READ_BAND },
    );

    for (const section of sections) {
      watcher.observe(section);
    }

    return () => {
      watcher.disconnect();
    };
  }, [key]);

  return inView !== null && ids.includes(inView) ? inView : (ids[0] ?? null);
};

export { useSectionInView };
