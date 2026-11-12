import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import type { ScrollFadeProps } from './ScrollFade.types';

const SLACK = 1;

/**
 * A box that scrolls up and down and fades its top and bottom edges into nothing only where there is
 * more to scroll to, beside a slim scrollbar, so a list cut off by its height says so, and one that
 * fits shows no fade at all. The caller gives it the height it may reach. While there is more to
 * scroll to it can be focused, so the keyboard can scroll it in Safari, which does not focus a box
 * that scrolls by itself.
 *
 * @param children - What scrolls.
 * @param label - What the box holds, which names it as a region for anybody moving through the
 *   page by its landmarks or focusing it to scroll.
 * @param fade - How far into the box each edge fades, in pixels.
 * @param className - Extra classes, such as its greatest height.
 */
const ScrollFade = ({ children, fade = 32, label, className }: ScrollFadeProps) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState({ isAbove: false, isBelow: false });

  const measure = useCallback(() => {
    const element = scroller.current;

    if (element === null) {
      return;
    }

    const isAbove = element.scrollTop > SLACK;
    const isBelow = element.scrollTop + element.clientHeight < element.scrollHeight - SLACK;

    setHidden((was) =>
      was.isAbove === isAbove && was.isBelow === isBelow ? was : { isAbove, isBelow },
    );
  }, []);

  useLayoutEffect(() => {
    const element = scroller.current;

    measure();

    if (element === null) {
      return undefined;
    }

    const watching = new ResizeObserver(measure);

    watching.observe(element);

    for (const child of element.children) {
      watching.observe(child);
    }

    return () => {
      watching.disconnect();
    };
  }, [measure]);

  return (
    <div
      ref={scroller}
      data-slot="scroll-fade"
      onScroll={measure}
      {...(hidden.isAbove ? { 'data-more-above': '' } : {})}
      {...(hidden.isBelow ? { 'data-more-below': '' } : {})}
      {...(hidden.isAbove || hidden.isBelow ? { tabIndex: 0 } : {})}
      {...(label === undefined ? {} : { role: 'region', 'aria-label': label })}
      className={cn(
        'valence-scrollbar min-h-0 overflow-y-auto overscroll-contain rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
        className,
      )}
      style={{
        maskImage: `linear-gradient(to bottom, ${hidden.isAbove ? 'transparent' : 'black'} 0, black ${(hidden.isAbove ? fade : 0).toString()}px, black calc(100% - ${(hidden.isBelow ? fade : 0).toString()}px), ${hidden.isBelow ? 'transparent' : 'black'} 100%)`,
      }}
    >
      {children}
    </div>
  );
};

ScrollFade.displayName = 'ScrollFade';

export { ScrollFade };
