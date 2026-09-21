import { useEffect, useState } from 'react';
import { pickActiveHeading } from '@ValenceDocs/components/DocPageView/components/OnThisPage/pickActiveHeading';
import type { PageHeading } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';

const READING_LINE = 120;

/**
 * Follows the page as it scrolls and says which of its headings is being read.
 *
 * @param headings - The page's headings.
 * @returns The id of the heading being read, or null where the page has none.
 */
const useActiveHeading = (headings: readonly PageHeading[]): string | null => {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const positions = headings.flatMap((heading) => {
        const element = document.getElementById(heading.id);

        return element === null
          ? []
          : [{ id: heading.id, top: element.getBoundingClientRect().top }];
      });

      setActive(
        pickActiveHeading(
          positions,
          READING_LINE,
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2,
        ),
      );
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [headings]);

  return active;
};

export { useActiveHeading };
