import { useQuery } from '@tanstack/react-query';
import { FavouriteIcon, MusicNote01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { ArtistShelf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { PlaylistShelf } from '@ValenceScreens/components/PlaylistShelf/PlaylistShelf';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';

const QUICK_PICKS = 5;

const RECENT = 18;

const ARTISTS = 12;

/**
 * What to say at the top of the page, by the hour.
 *
 * @param hour - The hour of the day.
 * @returns The greeting.
 */
const greetingFor = (hour: number): string => {
  if (hour < 5) {
    return 'Up late';
  }

  if (hour < 12) {
    return 'Good morning';
  }

  return hour < 18 ? 'Good afternoon' : 'Good evening';
};

/**
 * The front page of the music section: the things somebody goes back to most — liked songs and
 * their own playlists — as a row of quick picks at the top, then what was added lately, the
 * artists in the library, and what the rest of the household has shared.
 */
const MusicHome = () => {
  const { open } = useMusicNavigation();
  const albums = useQuery(musicQueries.albums('recent'));
  const artists = useQuery(musicQueries.artists());
  const playlists = useQuery(musicQueries.playlists());
  const mine = (playlists.data ?? []).filter((playlist) => playlist.isMine);
  const shared = (playlists.data ?? []).filter((playlist) => !playlist.isMine);

  if (albums.isPending) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <Skeleton label="Reading your music" className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if ((albums.data ?? []).length === 0 && mine.length === 0 && shared.length === 0) {
    return (
      <NothingHere
        of={MusicNote01Icon}
        title="No music yet"
        detail="Once a music library has been added and scanned, its albums and artists will be here."
        fills
      />
    );
  }

  return (
    <div className="flex flex-col gap-10 px-3 pt-8 pb-12 sm:px-5">
      <section aria-label="Quick picks" className="flex flex-col gap-4 px-2">
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-[-0.03em] text-text">
          {greetingFor(new Date().getHours())}
        </h1>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <Button
            variant="bare"
            size="none"
            hasTooltip={false}
            className="flex items-center gap-3 overflow-hidden rounded-md bg-hover pr-3 text-left font-semibold text-text transition-colors hover:bg-active"
            onClick={() => {
              open({ kind: 'liked' });
            }}
          >
            <span className="flex size-14 shrink-0 items-center justify-center bg-accent text-accent-contrast">
              <Icon of={FavouriteIcon} size={22} isActive />
            </span>
            Liked Songs
          </Button>

          {mine.slice(0, QUICK_PICKS).map((playlist) => (
            <Button
              key={playlist.id}
              variant="bare"
              size="none"
              hasTooltip={false}
              className="flex items-center gap-3 overflow-hidden rounded-md bg-hover pr-3 text-left font-semibold text-text transition-colors hover:bg-active"
              onClick={() => {
                open({ kind: 'playlist', id: playlist.id });
              }}
            >
              <PlaylistCover
                name={playlist.name}
                albumIds={playlist.artworkAlbumIds}
                className="size-14 rounded-none"
              />
              <span className="truncate">{playlist.name}</span>
            </Button>
          ))}
        </div>
      </section>

      <AlbumShelf heading="Recently added" albums={(albums.data ?? []).slice(0, RECENT)} />

      <ArtistShelf heading="Artists" artists={(artists.data ?? []).slice(0, ARTISTS)} />

      <PlaylistShelf heading="Your playlists" playlists={mine} />

      <PlaylistShelf heading="Shared with you" playlists={shared} />
    </div>
  );
};

MusicHome.displayName = 'MusicHome';

export { MusicHome, greetingFor };
