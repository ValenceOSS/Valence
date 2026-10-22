import type { QueryClient } from '@tanstack/react-query';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';

/**
 * Marks films or episodes watched, or unwatched again, showing it straight away and putting it back
 * if the server refuses. Only what depends on having watched something is read again afterwards — how
 * far through everything the viewer is and the programmes' counts of what is left — so a screen keeps
 * what it is showing rather than reading the whole library again.
 *
 * @param cache - The query cache the screens read from.
 * @param items - What to mark, with how long each runs.
 * @param isWatched - Whether they have now watched them, or have not.
 * @param now - The clock.
 * @throws Where the server would not record every one of them, after putting the marks back.
 */
const markWatchedInPlace = async (
  cache: QueryClient,
  items: readonly { id: string; durationSeconds: number }[],
  isWatched: boolean,
  now: () => Date = () => new Date(),
): Promise<void> => {
  const progressKey = viewingQueries.progress().queryKey;
  const marked = new Set(items.map((item) => item.id));
  const before = cache.getQueryData(progressKey);

  await cache.cancelQueries({ queryKey: progressKey, exact: true });

  if (before !== undefined) {
    const updatedAt = now().toISOString();

    cache.setQueryData(progressKey, [
      ...before.filter((entry) => !marked.has(entry.mediaId)),
      ...(isWatched
        ? items.map((item) => ({
            mediaId: item.id,
            positionSeconds: Math.max(item.durationSeconds, 1),
            durationSeconds: Math.max(item.durationSeconds, 1),
            isFinished: true,
            updatedAt,
          }))
        : []),
    ]);
  }

  try {
    await markWatched(items, isWatched);
  } catch (error) {
    if (before !== undefined) {
      cache.setQueryData(progressKey, before);
    }

    throw error;
  } finally {
    await Promise.all([
      cache.invalidateQueries({ queryKey: progressKey }),
      cache.invalidateQueries({ queryKey: [...libraryQueries.key, 'shows'] }),
      cache.invalidateQueries({ queryKey: [...libraryQueries.key, 'show'] }),
    ]);
  }
};

export { markWatchedInPlace };
