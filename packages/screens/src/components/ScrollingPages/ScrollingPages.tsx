import { useEffect, useRef, useState } from 'react';
import { bookPageUrl } from '@ValenceClient/books/fetchBooks';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { ScrollingPagesProps } from './ScrollingPages.types';

const ACROSS = 1200;

/**
 * A chapter laid out as one long strip, read by scrolling down it rather than by turning from page
 * to page — the way a webtoon is made to be read, where the pages run into one another and a break
 * between them would be a break in the picture.
 *
 * The pages are asked for as they come near, so a chapter of a hundred does not fetch a hundred
 * pictures to show the first. Which page is across the middle of the screen is the one somebody is
 * up to, and is reported as they scroll so the place is kept. At the foot of the strip is the way on
 * to the next chapter, or the plain end where there is none.
 *
 * @param bookId - The book being read.
 * @param chapterId - The chapter laid out.
 * @param pageCount - How many pages it has.
 * @param startAtPage - Where to begin, for somebody coming back.
 * @param hasNextChapter - Whether there is another after this one.
 * @param onPageChange - Told the page across the middle of the screen as it changes.
 * @param onNextChapter - Called to carry on into the next chapter.
 * @param onTap - Called when the strip is pressed, to bring the controls back.
 */
const ScrollingPages = ({
  bookId,
  chapterId,
  pageCount,
  startAtPage,
  hasNextChapter,
  onPageChange,
  onNextChapter,
  onTap,
}: ScrollingPagesProps) => {
  const strip = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(new Set());
  const report = useRef(onPageChange);

  useEffect(() => {
    report.current = onPageChange;
  });

  useEffect(() => {
    strip.current
      ?.querySelector(
        `[data-page="${Math.min(startAtPage, Math.max(pageCount - 1, 0)).toString()}"]`,
      )
      ?.scrollIntoView({ block: 'start' });
  }, [chapterId, startAtPage, pageCount]);

  useEffect(() => {
    const holder = strip.current;

    if (holder === null) {
      return;
    }

    const watching = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const page = Number(entry.target.getAttribute('data-page'));

          if (entry.isIntersecting && Number.isFinite(page)) {
            report.current(page);
          }
        });
      },
      { root: holder, rootMargin: '-50% 0px -50% 0px' },
    );

    holder.querySelectorAll('[data-page]').forEach((page) => {
      watching.observe(page);
    });

    return () => {
      watching.disconnect();
    };
  }, [chapterId, pageCount]);

  return (
    <div
      ref={strip}
      className="valence-rail h-full w-full overflow-y-auto"
      onClick={onTap}
      role="presentation"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        {Array.from({ length: pageCount }, (_, page) => (
          <img
            key={page}
            data-page={page}
            src={bookPageUrl(bookId, chapterId, page, ACROSS)}
            alt={`Page ${(page + 1).toString()}`}
            loading="lazy"
            onLoad={() => {
              setLoaded((was) => new Set([...was, page]));
            }}
            className={cn('block w-full select-none', loaded.has(page) ? '' : 'min-h-[70vh]')}
          />
        ))}

        <div className="flex min-h-40 items-center justify-center p-8">
          {hasNextChapter ? (
            <Button variant="confirm" size="lg" onClick={onNextChapter}>
              Next chapter
            </Button>
          ) : (
            <span className="text-sm text-on-scrim/70">The end</span>
          )}
        </div>
      </div>
    </div>
  );
};

ScrollingPages.displayName = 'ScrollingPages';

export { ScrollingPages };
