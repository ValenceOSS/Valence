import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';
import { askOfEntry } from '@ValenceClient/requests/askOfEntry';
import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const AT_ONCE = 4;

/**
 * Follows each of a set of titles, a few at a time, saying how far it has got after each one. It
 * stops starting new ones once told to, and never fails: a title that cannot be followed is
 * counted, not thrown.
 *
 * @param titles - The titles to follow.
 * @param onProgress - Told how many have been tried so far.
 * @param isStopped - Asked before each title whether to stop.
 * @returns The requests that now follow them, and how many could not be followed.
 */
const followEveryTitle = async (
  titles: readonly CatalogueEntry[],
  onProgress: (done: number) => void,
  isStopped: () => boolean = () => false,
): Promise<{ followed: MediaRequest[]; failed: number }> => {
  const followed: MediaRequest[] = [];
  const queue = [...titles];
  let failed = 0;
  let done = 0;

  const work = async (): Promise<void> => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      if (isStopped()) {
        return;
      }

      const asked = askOfEntry(next);
      const sent = asked === null ? null : await askForMedia(asked).catch(() => null);

      if (sent === null || sent.value === null) {
        failed += 1;
      } else {
        followed.push(sent.value);
      }

      done += 1;
      onProgress(done);
    }
  };

  await Promise.all(Array.from({ length: AT_ONCE }, work));

  return { followed, failed };
};

export { followEveryTitle };
