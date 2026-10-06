import { useEffect, useState } from 'react';
import { useInView } from 'motion/react';
import type { RefObject } from 'react';

type Reach = {
  amount?: number;
  margin?: `${number}px`;
};

/**
 * Whether the page has been scrolled far enough to reach something: true once it comes into view,
 * and kept true while it sits above the window, so what has been read stays shown on the way down
 * and is only put back when the page is scrolled up past it again.
 *
 * @param ref - The element to watch.
 * @param reach - How much of it must be in view, and how far the edges of the window are moved in.
 * @returns Whether it has been reached.
 */
const useReached = (ref: RefObject<Element | null>, { amount, margin }: Reach = {}): boolean => {
  const isInView = useInView(ref, {
    ...(amount === undefined ? {} : { amount }),
    ...(margin === undefined ? {} : { margin }),
  });
  const [isReached, setIsReached] = useState(false);

  useEffect(() => {
    if (isInView) {
      setIsReached(true);

      return undefined;
    }

    const putBackIfBelow = () => {
      const element = ref.current;

      if (element !== null && element.getBoundingClientRect().top > window.innerHeight) {
        setIsReached(false);
      }
    };

    putBackIfBelow();
    window.addEventListener('scroll', putBackIfBelow, { passive: true });

    return () => {
      window.removeEventListener('scroll', putBackIfBelow);
    };
  }, [isInView, ref]);

  return isReached;
};

export { useReached };
