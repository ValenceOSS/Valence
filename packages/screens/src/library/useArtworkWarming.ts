import { useEffect } from 'react';

const AT_ONCE = 6;

const MOST_KEPT = 600;

const kept = new Map<string, HTMLImageElement>();

/**
 * Keeps a picture that has been fetched and decoded, the oldest let go once there are too many, so a
 * card that is drawn again after scrolling away finds its picture already there.
 *
 * @param url - Where the picture is.
 * @param picture - The picture.
 */
const keep = (url: string, picture: HTMLImageElement): void => {
  kept.set(url, picture);

  if (kept.size > MOST_KEPT) {
    const oldest = kept.keys().next().value;

    if (oldest !== undefined) {
      kept.delete(oldest);
    }
  }
};

/**
 * Asks for the pictures a page is about to draw as soon as it knows them, rather than as each card
 * comes near the screen: a few at a time, in the order given, each decoded once it arrives and kept,
 * so that by the time its card is drawn the picture is already there to show at once. Pictures
 * already fetched are not asked for again.
 *
 * @param urls - The pictures, the first to be seen first.
 */
const useArtworkWarming = (urls: readonly (string | undefined)[]): void => {
  const wanted = urls.filter((url): url is string => url !== undefined).join('\n');

  useEffect(() => {
    if (wanted === '' || typeof Image === 'undefined') {
      return;
    }

    const waiting = wanted.split('\n').filter((url) => !kept.has(url));
    let isStopped = false;
    let running = 0;

    const next = () => {
      while (!isStopped && running < AT_ONCE) {
        const url = waiting.shift();

        if (url === undefined) {
          return;
        }

        const picture = new Image();

        picture.decoding = 'async';
        picture.src = url;
        keep(url, picture);
        running += 1;

        void picture
          .decode()
          .catch(() => undefined)
          .then(() => {
            running -= 1;
            next();
          });
      }
    };

    next();

    return () => {
      isStopped = true;
    };
  }, [wanted]);
};

export { useArtworkWarming };
