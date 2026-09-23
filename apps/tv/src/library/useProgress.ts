import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

/**
 * How far through everything this viewer is, by title.
 *
 * @returns The progress by title, and whether it has arrived yet.
 */
const useProgress = (): { progress: Map<string, WatchProgress>; isKnown: boolean } => {
  const watched = useQuery(viewingQueries.progress());
  const progress = useMemo(() => byMediaId(watched.data ?? []), [watched.data]);

  return { progress, isKnown: !watched.isLoading };
};

export { useProgress };
