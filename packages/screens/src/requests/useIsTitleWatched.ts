import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { isTitleWatched } from '@ValenceClient/requests/isTitleWatched';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Tells whether whoever is watching has seen a catalogue title to the end, from the progress this
 * profile already reads, so a card can mark it the way the library marks what is watched.
 *
 * @returns Whether a title is watched.
 */
const useIsTitleWatched = (): ((title: CatalogueTitle) => boolean) => {
  const watched = useQuery(viewingQueries.progress());
  const progress = useMemo(() => byMediaId(watched.data ?? []), [watched.data]);

  return useCallback((title: CatalogueTitle) => isTitleWatched(title, progress), [progress]);
};

export { useIsTitleWatched };
