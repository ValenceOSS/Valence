import { useQueryClient } from '@tanstack/react-query';
import { markWatchedInPlace } from '@ValenceClient/playback/markWatchedInPlace';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Marks films or episodes watched, or unwatched again, showing it at once, so the cards and the
 * count of what is left follow without the shelves being read again.
 *
 * @returns What to call with the titles and whether they are now watched.
 */
const useMarkWatched = (): ((which: readonly MediaSummary[], isWatched: boolean) => void) => {
  const cache = useQueryClient();

  return (which, isWatched) => {
    void markWatchedInPlace(cache, which, isWatched).catch(() => null);
  };
};

export { useMarkWatched };
