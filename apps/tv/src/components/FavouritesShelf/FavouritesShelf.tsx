import { memo, useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import type { FavouritesShelfProps } from './FavouritesShelf.types';
import { say } from '@ValenceI18n/say';

const AT_MOST = 40;

/**
 * The films and programmes this viewer has kept, as a shelf of their own on the home page, most
 * recently kept first, so what somebody marked to come back to is somewhere to come back to from
 * the sofa. Only what this television may play is shown, and nothing is drawn where nothing is kept.
 *
 * Keeping or letting go of something leaves the shelf where it is: what was let go of leaves at
 * once, and what was newly kept joins once it has been read, rather than the shelf going away and
 * everything beneath it moving up while the list is read again.
 *
 * @param viewerId - Whose favourites they are.
 * @param watchable - The libraries this television plays from.
 * @param progress - How far through each title this viewer is.
 * @param onOpen - Told to open a film's or a programme's page.
 */
const FavouritesShelfDrawn = ({ viewerId, watchable, progress, onOpen }: FavouritesShelfProps) => {
  const kept = useQuery(viewingQueries.favourites(viewerId));
  const ids = useMemo(() => (kept.data ?? []).slice(0, AT_MOST), [kept.data]);

  const found = useQuery({
    ...libraryQueries.across(watchable, { ids, limit: ids.length }),
    enabled: ids.length > 0 && watchable.length > 0,
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => {
    const byId = new Map((found.data ?? []).map((media) => [media.id, media]));

    return ids.flatMap((id) => {
      const media = byId.get(id);

      return media === undefined ? [] : [media];
    });
  }, [found.data, ids]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Shelf title={say('common.favourites')} items={items} progress={progress} onOpen={onOpen} />
  );
};

const FavouritesShelf = memo(FavouritesShelfDrawn);

FavouritesShelf.displayName = 'FavouritesShelf';

export { FavouritesShelf };
