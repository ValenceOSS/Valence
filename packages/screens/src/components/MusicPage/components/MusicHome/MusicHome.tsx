import { useQuery } from '@tanstack/react-query';
import { MusicNote as MusicNoteIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { ArtistShelf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { PlaylistShelf } from '@ValenceScreens/components/PlaylistShelf/PlaylistShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLikedSongsTile } from '@ValenceScreens/music/useLikedSongsTile';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { MusicFeature } from './components/MusicFeature/MusicFeature';
import type { MusicView } from '@ValenceClient/music/musicView';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const RECENT = 18;

const ARTISTS = 18;

/**
 * The front of the music section: whatever is playing, large, then rails of what somebody goes back
 * to — their playlists with their liked songs at the front, what was added lately, the artists in
 * the library, and what the rest of the household has shared — each paging sideways the way the
 * film rows do, and each with a way through to the whole of it.
 */
const MusicHome = () => {
  const { open } = useMusicNavigation();
  const liked = useLikedSongsTile();
  const albums = useQuery(musicQueries.albums('recent'));
  const artists = useQuery(musicQueries.artists());
  const playlists = useQuery(musicQueries.playlists());
  const mine = (playlists.data ?? []).filter((playlist) => playlist.isMine);
  const shared = (playlists.data ?? []).filter((playlist) => !playlist.isMine);

  const seeAll = (view: MusicView, label: StringKey) => (
    <Button
      variant="subtle"
      size="none"
      label={say(label)}
      hasTooltip={false}
      className="text-sm"
      onClick={() => {
        open(view);
      }}
    >
      {say('screens.musicHome.seeAll')}
    </Button>
  );

  if (albums.isPending) {
    return (
      <div className={`flex flex-col gap-6 py-8 sm:flex-row sm:items-end ${MUSIC_LANES.page}`}>
        <Skeleton label={say('screens.musicHome.reading')} className="size-60" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-2/3" />
        </div>
      </div>
    );
  }

  const recent = albums.data ?? [];

  if (recent.length === 0 && mine.length === 0 && shared.length === 0) {
    return (
      <NothingHere
        of={MusicNoteIcon}
        title={say('screens.musicHome.emptyTitle')}
        detail={say('screens.musicHome.emptyDetail')}
        fills
      />
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-12">
      <MusicFeature newest={recent[0] ?? null} />

      <PlaylistShelf
        heading={say('screens.musicHome.yourPlaylists')}
        playlists={mine}
        leading={liked}
        action={seeAll({ kind: 'playlists' }, 'screens.musicHome.seeAllPlaylists')}
      />

      <AlbumShelf
        heading={say('screens.musicHome.recentlyAdded')}
        albums={recent.slice(0, RECENT)}
        action={seeAll({ kind: 'albums' }, 'screens.musicHome.seeAllAlbums')}
      />

      <ArtistShelf
        heading={say('screens.musicHome.artists')}
        artists={(artists.data ?? []).slice(0, ARTISTS)}
        action={seeAll({ kind: 'artists' }, 'screens.musicHome.seeAllArtists')}
      />

      <PlaylistShelf heading={say('screens.musicHome.sharedWithYou')} playlists={shared} />
    </div>
  );
};

MusicHome.displayName = 'MusicHome';

export { MusicHome };
