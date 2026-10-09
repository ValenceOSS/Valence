import { useQueryClient } from '@tanstack/react-query';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Marks films or episodes watched, or unwatched again, and reads progress and the shelves again so
 * the cards and the count of what is left follow.
 *
 * @returns What to call with the titles and whether they are now watched.
 */
const useMarkWatched = (): ((which: readonly MediaSummary[], isWatched: boolean) => void) => {
  const cache = useQueryClient();

  return (which, isWatched) => {
    void markWatched(which, isWatched)
      .then(async () =>
        Promise.all([
          cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey }),
          cache.invalidateQueries({ queryKey: libraryQueries.key }),
        ]),
      )
      .catch(() => null);
  };
};

export { useMarkWatched };
