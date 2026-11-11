import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@ValenceUI/cn';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { TEXT_FLOW } from '@ValenceScreens/components/TextReader/TEXT_FLOW';
import { ScrollingPart } from './components/ScrollingPart/ScrollingPart';
import type { ScrollingTextProps } from './ScrollingText.types';

const MOST_WIDTH = 760;

const READ_LINE = 0.25;

const AHEAD = '150%';

/**
 * A book as one long page, scrolled rather than turned: the part somebody is in, with the parts
 * after it joined on beneath as they near the bottom and the ones before it above as they near the
 * top, kept in place while they arrive so the text being read does not jump.
 *
 * Which part is across the upper quarter of the screen, and how far into it, is reported as it
 * scrolls, for the slider, the contents and remembering where somebody is up to.
 *
 * @param bookId - The book.
 * @param chapterId - The file its text is in.
 * @param startPart - The part to open on.
 * @param landing - Where in that part to open.
 * @param lastPart - The last part there is.
 * @param pageClassName - The colours of the page.
 * @param textStyle - How the text is set: its size, leading and face.
 * @param inset - How far the text stands in from the sides of the page.
 * @param onPlace - Told which part is being read and how far into it, as a fraction.
 * @param onFollow - Told when a link within the book is followed.
 * @param onScroller - Given the element that scrolls, for the keys that move down and up a screen.
 */
const ScrollingText = ({
  bookId,
  chapterId,
  startPart,
  landing,
  lastPart,
  pageClassName,
  textStyle,
  inset,
  onPlace,
  onFollow,
  onScroller,
}: ScrollingTextProps) => {
  const cache = useQueryClient();
  const scroller = useRef<HTMLDivElement | null>(null);
  const top = useRef<HTMLDivElement | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);
  const [from, setFrom] = useState(startPart);
  const [to, setTo] = useState(startPart);
  const [hasLanded, setHasLanded] = useState(false);
  const heightBefore = useRef<number | null>(null);
  const reporting = useRef(0);
  const tell = useRef(onPlace);

  useEffect(() => {
    tell.current = onPlace;
  });

  useEffect(() => {
    onScroller(scroller.current);

    return () => {
      onScroller(null);
    };
  }, [onScroller]);

  useEffect(() => {
    let isLive = true;

    void cache.fetchQuery(bookQueries.document(bookId, chapterId, startPart)).then(() => {
      requestAnimationFrame(() => {
        const element = scroller.current;
        const section =
          element === null
            ? null
            : element.querySelector<HTMLElement>(`[data-part="${startPart.toString()}"]`);

        if (!isLive || element === null || section === null) {
          return;
        }

        const target = landing.kind === 'anchor' ? document.getElementById(landing.anchor) : null;

        element.scrollTop =
          landing.kind === 'within'
            ? section.offsetTop + landing.within * section.offsetHeight
            : landing.kind === 'end'
              ? section.offsetTop + section.offsetHeight - element.clientHeight
              : landing.kind === 'anchor' && target !== null
                ? target.getBoundingClientRect().top -
                  element.getBoundingClientRect().top +
                  element.scrollTop
                : section.offsetTop;
        setHasLanded(true);
      });
    });

    return () => {
      isLive = false;
    };
  }, [bookId, cache, chapterId, landing, startPart]);

  useLayoutEffect(() => {
    const element = scroller.current;

    if (element !== null && heightBefore.current !== null) {
      element.scrollTop += element.scrollHeight - heightBefore.current;
      heightBefore.current = null;
    }
  }, [from]);

  useEffect(() => {
    const element = scroller.current;

    if (element === null || !hasLanded) {
      return undefined;
    }

    const watcher = new IntersectionObserver(
      (seen) => {
        for (const one of seen) {
          if (!one.isIntersecting) {
            continue;
          }

          if (one.target === bottom.current && to < lastPart) {
            setTo(to + 1);
          }

          if (one.target === top.current && from > 0) {
            void cache.fetchQuery(bookQueries.document(bookId, chapterId, from - 1)).then(() => {
              heightBefore.current = element.scrollHeight;
              setFrom(from - 1);
            });
          }
        }
      },
      { root: element, rootMargin: `${AHEAD} 0px` },
    );

    if (top.current !== null) {
      watcher.observe(top.current);
    }

    if (bottom.current !== null) {
      watcher.observe(bottom.current);
    }

    return () => {
      watcher.disconnect();
    };
  }, [bookId, cache, chapterId, from, hasLanded, lastPart, to]);

  const onScroll = () => {
    if (reporting.current !== 0) {
      return;
    }

    reporting.current = requestAnimationFrame(() => {
      reporting.current = 0;

      const element = scroller.current;

      if (element === null) {
        return;
      }

      const line = element.scrollTop + element.clientHeight * READ_LINE;
      const sections = [...element.querySelectorAll<HTMLElement>('[data-part]')];
      const reading =
        sections.find((one) => one.offsetTop + one.offsetHeight > line) ?? sections.at(-1);

      if (reading !== undefined) {
        const within = (line - reading.offsetTop) / Math.max(reading.offsetHeight, 1);

        tell.current(Number(reading.dataset['part']), Math.min(Math.max(within, 0), 1));
      }
    });
  };

  const parts = Array.from({ length: to - from + 1 }, (_, at) => from + at);

  return (
    <div
      ref={scroller}
      data-reading-scroller
      onScroll={onScroll}
      className={cn(
        'h-full w-full overflow-y-auto overscroll-contain transition-opacity duration-[var(--duration-fast)]',
        hasLanded ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn('mx-auto min-h-full', pageClassName)}
        style={{ maxWidth: MOST_WIDTH, paddingInline: inset, paddingBlock: inset }}
      >
        <div ref={top} aria-hidden className="h-px" />
        <div className={TEXT_FLOW} style={textStyle}>
          {parts.map((part) => (
            <ScrollingPart
              key={part}
              bookId={bookId}
              chapterId={chapterId}
              part={part}
              onFollow={onFollow}
            />
          ))}
        </div>
        <div ref={bottom} aria-hidden className="h-px" />
      </div>
    </div>
  );
};

ScrollingText.displayName = 'ScrollingText';

export { ScrollingText };
