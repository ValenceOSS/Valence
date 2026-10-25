import type { QueryClient } from '@tanstack/react-query';
import { setDismissed } from '@ValenceClient/library/setDismissed';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';

/**
 * Takes something off continue watching, or puts it back, at once on screen and back again if the
 * server refuses.
 *
 * @param cache - The query cache the screens read from.
 * @param mediaId - The film or episode on the row.
 * @param isDismissed - Whether it should be off the row.
 * @returns Whether the server agreed.
 */
const dismissInPlace = async (
  cache: QueryClient,
  mediaId: string,
  isDismissed: boolean,
): Promise<boolean> => {
  const progressKey = viewingQueries.progress().queryKey;
  const upNextKey = viewingQueries.upNext().queryKey;
  const before = cache.getQueryData(progressKey);
  const upNextBefore = cache.getQueryData(upNextKey);

  await Promise.all([
    cache.cancelQueries({ queryKey: progressKey, exact: true }),
    cache.cancelQueries({ queryKey: upNextKey, exact: true }),
  ]);

  if (before !== undefined) {
    cache.setQueryData(
      progressKey,
      before.map((entry) => (entry.mediaId === mediaId ? { ...entry, isDismissed } : entry)),
    );
  }

  if (isDismissed && upNextBefore !== undefined) {
    cache.setQueryData(
      upNextKey,
      upNextBefore.filter(({ episode }) => episode.id !== mediaId),
    );
  }

  const isAgreed = await setDismissed(mediaId, isDismissed);

  if (!isAgreed) {
    if (before !== undefined) {
      cache.setQueryData(progressKey, before);
    }

    if (upNextBefore !== undefined) {
      cache.setQueryData(upNextKey, upNextBefore);
    }
  }

  void cache.invalidateQueries({ queryKey: progressKey });

  return isAgreed;
};

export { dismissInPlace };
