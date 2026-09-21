import { useEffect, useRef } from 'react';
import { pagesToWarm } from './pagesToWarm';

const AT_ONCE = 6;

const WHOLE_CHAPTER_UP_TO = 250;

const WINDOW = 120;

/**
 * Has the pages around somebody already fetched and decoded before they get to them, so turning
 * pages quickly — a key held down, a thumb flicked — never arrives at one that is still on its way.
 * Nearest first, a few at a time so the page in front of them is not made to wait behind the rest,
 * and only a window of them where the book is long, dropping the ones left behind.
 *
 * @param centre - The page somebody is on.
 * @param count - How many pages the chapter has.
 * @param urlFor - The address of a page.
 */
const usePageWarming = (centre: number, count: number, urlFor: (page: number) => string): void => {
  const held = useRef(new Map<string, HTMLImageElement>());
  const urlOf = useRef(urlFor);

  useEffect(() => {
    urlOf.current = urlFor;
  });

  useEffect(() => {
    const wanted = pagesToWarm(centre, count, count <= WHOLE_CHAPTER_UP_TO ? count : WINDOW).map(
      (page) => urlOf.current(page),
    );
    const keeping = new Set(wanted);
    const queue = wanted.filter((address) => !held.current.has(address));
    let running = 0;
    let isCancelled = false;

    held.current.forEach((_, address) => {
      if (!keeping.has(address)) {
        held.current.delete(address);
      }
    });

    const next = () => {
      while (!isCancelled && running < AT_ONCE) {
        const address = queue.shift();

        if (address === undefined) {
          return;
        }

        const picture = new Image();

        picture.decoding = 'async';
        running += 1;

        const finish = () => {
          running -= 1;
          next();
        };

        picture.onload = finish;
        picture.onerror = finish;
        picture.src = address;
        held.current.set(address, picture);
      }
    };

    next();

    return () => {
      isCancelled = true;
    };
  }, [centre, count]);
};

export { usePageWarming };
