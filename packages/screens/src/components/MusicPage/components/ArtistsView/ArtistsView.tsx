import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User as UserIcon } from '@keyline-icons/react';
import { NothingHere } from '@ValenceUI/NothingHere';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { ArtistShelf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { say } from '@ValenceI18n/say';

const WHICH = [
  { id: 'all', label: say('common.everyone') },
  { id: 'followed', label: say('common.following') },
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
      label={say('common.whichArtistsToShow')}
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
        <Skeleton
          label={say('screens.musicPage.artistsView.readingYourArtists')}
          className="h-64 w-full"
        />
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
            of={UserIcon}
            title={
              isFollowedOnly ? say('common.notFollowingAnybodyYet') : say('common.noArtistsYet')
            }
            detail={
              isFollowedOnly
                ? say('common.followAnArtistFromTheirPage')
                : say('common.onceAMusicLibraryHasBeen2')
            }
          />
        </>
      ) : (
        <ArtistShelf heading={say('common.artists')} layout="grid" artists={found} action={which} />
      )}
    </div>
  );
};

ArtistsView.displayName = 'ArtistsView';

export { ArtistsView };
