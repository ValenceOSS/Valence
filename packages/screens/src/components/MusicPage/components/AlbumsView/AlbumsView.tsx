import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Record as RecordIcon } from '@keyline-icons/react';
import { NothingHere } from '@ValenceUI/NothingHere';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import type { AlbumOrder } from '@ValenceClient/music/fetchMusic';
import { say } from '@ValenceI18n/say';

const ORDERS = [
  { id: 'recent', label: say('common.recentlyAdded') },
  { id: 'title', label: say('common.aZ') },
  { id: 'year', label: say('common.year') },
] as const;

/**
 * Whether a choice is one of the orders albums can be put in.
 *
 * @param id - The choice.
 * @returns Whether it is an order.
 */
const isOrder = (id: string): id is AlbumOrder => ORDERS.some((order) => order.id === id);

/**
 * Every album in the library, as a grid, in whichever order somebody is looking for one by.
 */
const AlbumsView = () => {
  const [order, setOrder] = useState<AlbumOrder>('recent');
  const albums = useQuery(musicQueries.albums(order));

  useLightTheMusic(null);

  if (albums.isPending) {
    return (
      <div className={`py-8 ${MUSIC_LANES.page}`}>
        <Skeleton
          label={say('screens.musicPage.albumsView.readingYourAlbums')}
          className="h-64 w-full"
        />
      </div>
    );
  }

  const found = albums.data ?? [];

  if (found.length === 0) {
    return (
      <NothingHere
        of={RecordIcon}
        title={say('common.noAlbumsYet')}
        detail={say('common.onceAMusicLibraryHasBeen')}
        fills
      />
    );
  }

  return (
    <div className="pt-6 pb-12">
      <AlbumShelf
        heading={say('common.albums')}
        layout="grid"
        albums={found}
        action={
          <SegmentedRow
            label={say('common.putTheAlbumsInOrderBy')}
            size="sm"
            items={ORDERS}
            value={order}
            onSelect={(id) => {
              if (isOrder(id)) {
                setOrder(id);
              }
            }}
          />
        }
      />
    </div>
  );
};

AlbumsView.displayName = 'AlbumsView';

export { AlbumsView };
