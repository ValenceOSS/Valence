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
import type { StringKey } from '@ValenceI18n/StringKey';

const WHICH = [
  { id: 'all', labelKey: 'screens.artistsView.everyone' },
  { id: 'followed', labelKey: 'screens.artistsView.following' },
] as const satisfies readonly { id: string; labelKey: StringKey }[];

/**
 * Every artist in the library as a grid of faces, or only the ones somebody follows.
 */
const ArtistsView = () => {
  const [isFollowedOnly, setIsFollowedOnly] = useState(false);
  const artists = useQuery(musicQueries.artists(isFollowedOnly));

  useLightTheMusic(null);

  const which = (
    <SegmentedRow
      label={say('screens.artistsView.whichLabel')}
      size="sm"
      items={WHICH.map((one) => ({ id: one.id, label: say(one.labelKey) }))}
      value={isFollowedOnly ? 'followed' : 'all'}
      onSelect={(id) => {
        setIsFollowedOnly(id === 'followed');
      }}
    />
  );

  if (artists.isPending) {
    return (
      <div className={`py-8 ${MUSIC_LANES.page}`}>
        <Skeleton label={say('screens.artistsView.reading')} className="h-64 w-full" />
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
              isFollowedOnly
                ? say('screens.artistsView.noneFollowedTitle')
                : say('screens.artistsView.emptyTitle')
            }
            detail={
              isFollowedOnly
                ? say('screens.artistsView.noneFollowedDetail')
                : say('screens.artistsView.emptyDetail')
            }
          />
        </>
      ) : (
        <ArtistShelf
          heading={say('screens.artistsView.heading')}
          layout="grid"
          artists={found}
          action={which}
        />
      )}
    </div>
  );
};

ArtistsView.displayName = 'ArtistsView';

export { ArtistsView };
