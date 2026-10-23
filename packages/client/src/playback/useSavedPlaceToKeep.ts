import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { isWorthResuming } from '@ValenceContracts/schemas/WatchProgress';

/**
 * Says where a viewer had got to in something a player started at the top before it knew, so the
 * player's reports never write over that place until the viewer passes it. A player that started
 * knowing where they were, at the top or not, keeps nothing: starting again then was a choice.
 *
 * @param mediaId - What is playing.
 * @param startSeconds - Where the player started.
 * @returns What to keep reports above, asked each time one is made.
 */
const useSavedPlaceToKeep = (mediaId: string, startSeconds: number): (() => number | null) => {
  const progress = useQuery(viewingQueries.progress());
  const startedUnknowing = useRef(startSeconds === 0 && progress.data === undefined);
  const saved = useRef<number | null>(null);

  useEffect(() => {
    const found = progress.data?.find((one) => one.mediaId === mediaId);

    saved.current =
      startedUnknowing.current && found !== undefined && isWorthResuming(found)
        ? found.positionSeconds
        : null;
  }, [progress.data, mediaId]);

  return useCallback(() => saved.current, []);
};

export { useSavedPlaceToKeep };
