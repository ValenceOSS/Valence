import { useState } from 'react';
import { bookPageUrl } from '@ValenceClient/books/fetchBooks';
import { Button } from '@ValenceUI/Button';
import { VirtualStrip } from '@ValenceUI/VirtualStrip';
import { cn } from '@ValenceUI/cn';
import { usePageWarming } from '@ValenceScreens/reading/usePageWarming';
import type { ScrollingPagesProps } from './ScrollingPages.types';

const ACROSS = 1200;

const A_PAGE = 1400;

/**
 * A chapter laid out as one long strip, read by scrolling down it rather than by turning from page
 * to page — the way a webtoon is made to be read, where the pages run into one another and a break
 * between them would be a break in the picture.
 *
 * Only the pages near the screen are held, however long the chapter, and the ones just ahead are
 * already fetched before they are reached, so scrolling fast never runs out onto an empty stretch.
 * Which page is across the middle of the screen is the one somebody is up to, and is reported as
 * they scroll so the place is kept. At the foot of the strip is the way on to the next chapter, or
 * the plain end where there is none.
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
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(new Set());
  const [current, setCurrent] = useState(startAtPage);

  usePageWarming(current, pageCount, (page) => bookPageUrl(bookId, chapterId, page, ACROSS));

  return (
    <VirtualStrip
      label="Pages"
      count={pageCount}
      estimateSize={A_PAGE}
      startAtIndex={startAtPage}
      onIndexChange={(page) => {
        setCurrent(page);
        onPageChange(page);
      }}
      onClick={onTap}
      footer={
        <div className="mx-auto flex min-h-40 max-w-3xl items-center justify-center p-8">
          {hasNextChapter ? (
            <Button variant="confirm" size="lg" onClick={onNextChapter}>
              Next chapter
            </Button>
          ) : (
            <span className="text-sm text-on-scrim/70">The end</span>
          )}
        </div>
      }
    >
      {(page) => (
        <img
          key={page}
          src={bookPageUrl(bookId, chapterId, page, ACROSS)}
          alt={`Page ${(page + 1).toString()}`}
          onLoad={() => {
            setLoaded((was) => new Set([...was, page]));
          }}
          className={cn(
            'mx-auto block w-full max-w-3xl select-none',
            loaded.has(page) ? '' : 'min-h-[70vh]',
          )}
        />
      )}
    </VirtualStrip>
  );
};

ScrollingPages.displayName = 'ScrollingPages';

export { ScrollingPages };
