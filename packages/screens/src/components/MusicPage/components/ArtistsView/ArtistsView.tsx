import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User03Icon } from '@hugeicons/core-free-icons';
import { NothingHere } from '@ValenceUI/NothingHere';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { ArtistShelf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';

const WHICH = [
  { id: 'all', label: 'Everyone' },
  { id: 'followed', label: 'Following' },
] as const;

/**
 * Every artist in the library as a grid of faces, or only the ones somebody follows.
 */
const ArtistsView = () => {
  const [isFollowedOnly, setIsFollowedOnly] = useState(false);
  const artists = useQuery(musicQueries.artists(isFollowedOnly));

  useLightTheMusic(null);

  const which = (
    <SegmentedRow
      label="Which artists to show"
      size="sm"
      items={WHICH}
      value={isFollowedOnly ? 'followed' : 'all'}
      onSelect={(id) => {
        setIsFollowedOnly(id === 'followed');
      }}
    />
  );

  if (artists.isPending) {
    return (
      <div className={`py-8 ${MUSIC_LANES.page}`}>
        <Skeleton label="Reading your artists" className="h-64 w-full" />
      </div>
    );
  }

  const found = artists.data ?? [];

  return (
    <div className="flex flex-col gap-6 pt-6 pb-12">
      {found.length === 0 ? (
        <>
          <div className={`flex justify-end ${MUSIC_LANES.page}`}>{which}</div>
          <NothingHere
            of={User03Icon}
            title={isFollowedOnly ? 'Not following anybody yet' : 'No artists yet'}
            detail={
              isFollowedOnly
                ? 'Follow an artist from their page and they will be here.'
                : 'Once a music library has been scanned, its artists will be here.'
            }
          />
        </>
      ) : (
        <ArtistShelf heading="Artists" layout="grid" artists={found} action={which} />
      )}
    </div>
  );
};

ArtistsView.displayName = 'ArtistsView';

export { ArtistsView };
