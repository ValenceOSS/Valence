import { useEffect } from 'react';

const AT_ONCE = 6;

const MOST_KEPT = 600;

const kept = new Map<string, HTMLImageElement>();

const queues = new Set<string[]>();

const slots = { running: 0 };

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
 * Starts the next pictures waiting, from every page asking, until as many are on their way as may
 * be at once; each one that settles makes room for the next.
 */
const pump = (): void => {
  for (const queue of queues) {
    while (slots.running < AT_ONCE) {
      const url = queue.shift();

      if (url === undefined) {
        break;
      }

      if (kept.has(url)) {
        continue;
      }

      const picture = new Image();

      picture.decoding = 'async';
      picture.src = url;
      keep(url, picture);
      slots.running += 1;

      void picture
        .decode()
        .catch(() => undefined)
        .then(() => {
          slots.running -= 1;
          pump();
        });
    }
  }
};

/**
 * Asks for the pictures a page is about to draw as soon as it knows them, rather than as each card
 * comes near the screen: a few at a time across every page asking, however often the list changes,
 * in the order given, each decoded once it arrives and kept, so that by the time its card is drawn
 * the picture is already there to show at once. Pictures already fetched are not asked for again.
 *
 * @param urls - The pictures, the first to be seen first.
 */
const useArtworkWarming = (urls: readonly (string | undefined)[]): void => {
  const wanted = urls.filter((url): url is string => url !== undefined).join('\n');

  useEffect(() => {
    if (wanted === '' || typeof Image === 'undefined') {
      return;
    }

    const queue = wanted.split('\n');

    queues.add(queue);
    pump();

    return () => {
      queues.delete(queue);
    };
  }, [wanted]);
};

export { useArtworkWarming };
