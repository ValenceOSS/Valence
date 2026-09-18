import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Album02Icon } from '@hugeicons/core-free-icons';
import { NothingHere } from '@ValenceUI/NothingHere';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import type { AlbumOrder } from '@ValenceClient/music/fetchMusic';

const ORDERS = [
  { id: 'recent', label: 'Recently added' },
  { id: 'title', label: 'A–Z' },
  { id: 'year', label: 'Year' },
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
        <Skeleton label="Reading your albums" className="h-64 w-full" />
      </div>
    );
  }

  const found = albums.data ?? [];

  if (found.length === 0) {
    return (
      <NothingHere
        of={Album02Icon}
        title="No albums yet"
        detail="Once a music library has been scanned, its albums will be here."
        fills
      />
    );
  }

  return (
    <div className="pt-6 pb-12">
      <AlbumShelf
        heading="Albums"
        layout="grid"
        albums={found}
        action={
          <SegmentedRow
            label="Put the albums in order by"
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
