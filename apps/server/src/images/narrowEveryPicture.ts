import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';

const AT_ONCE = 4;

type NarrowEveryPictureOptions = {
  listArtworkUrls: () => Promise<(string | null)[]>;
  read: (url: string, width: number) => Promise<object | null>;
  atOnce?: number;
  onProblem?: (url: string) => void;
  onProgress?: (processed: number, total: number) => void;
};

/**
 * Makes the narrowed copy of every picture the libraries show, at every width a card asks for,
 * so the first person to scroll past a title finds its picture already made and served from disk
 * rather than fetched and narrowed while they wait. A copy already made is read back and kept, so
 * running it again costs little.
 *
 * @param options - Which pictures there are, how one is narrowed, and how many at once.
 * @returns How many copies were made or found, and how many could not be.
 */
const narrowEveryPicture = async ({
  listArtworkUrls,
  read,
  atOnce = AT_ONCE,
  onProblem,
  onProgress,
}: NarrowEveryPictureOptions): Promise<{ made: number; failed: number }> => {
  const urls = [...new Set(await listArtworkUrls())].filter((url): url is string => url !== null);
  const asks = urls.flatMap((url) =>
    Object.values(ARTWORK_WIDTHS).map((width) => ({ url, width })),
  );
  const tally = { made: 0, failed: 0, next: 0 };

  /**
   * Narrows the next picture waiting until none are left.
   */
  const work = async (): Promise<void> => {
    while (tally.next < asks.length) {
      const ask = asks[tally.next];

      tally.next += 1;

      if (ask === undefined) {
        return;
      }

      const narrowed = await read(ask.url, ask.width).catch(() => null);

      if (narrowed === null) {
        tally.failed += 1;
        onProblem?.(ask.url);
      } else {
        tally.made += 1;
      }

      onProgress?.(tally.made + tally.failed, asks.length);
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, atOnce) }, () => work()));

  return { made: tally.made, failed: tally.failed };
};

export { narrowEveryPicture };
