import { useQuery } from '@tanstack/react-query';
import { MusicNote as MusicNoteIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { MixShelf } from '@ValenceScreens/components/MixShelf/MixShelf';
import { PlaylistShelf } from '@ValenceScreens/components/PlaylistShelf/PlaylistShelf';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { MusicFeature } from './components/MusicFeature/MusicFeature';
import type { MusicView } from '@ValenceClient/music/musicView';
import type { MixKind } from '@ValenceContracts/schemas/MusicMix';
import { say } from '@ValenceI18n/say';

const RECENT = 18;

const FOR_THEM: ReadonlySet<MixKind> = new Set(['daily', 'onRepeat', 'rediscover']);

/**
 * The front of the music section: the newest record, then what Valence made for this person today,
 * stations built around the artists they play, what they played lately, mixes of the genres and
 * decades they have plenty of, and the playlists they made themselves.
 */
const MusicHome = () => {
  const { open } = useMusicNavigation();
  const albums = useQuery(musicQueries.albums('recent'));
  const played = useQuery(musicQueries.albums('played'));
  const watching = useQuery(profileQueries.watching());
  const playlists = useQuery(musicQueries.playlists());
  const mixes = useQuery(musicQueries.mixes());
  const mine = (playlists.data ?? []).filter((playlist) => playlist.isMine);
  const shared = (playlists.data ?? []).filter((playlist) => !playlist.isMine);

  const seeAll = (view: MusicView, what: string) => (
    <Button
      variant="subtle"
      size="none"
      label={say('screens.musicPage.musicHome.seeAllWhat', { what })}
      hasTooltip={false}
      className="text-sm"
      onClick={() => {
        open(view);
      }}
    >
      {say('common.seeAll')}
    </Button>
  );

  if (albums.isPending) {
    return (
      <div className={`flex flex-col gap-6 py-8 sm:flex-row sm:items-end ${MUSIC_LANES.page}`}>
        <Skeleton label={say('screens.musicPage.musicHome.readingYourMusic')} className="size-60" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-2/3" />
        </div>
      </div>
    );
  }

  const recent = albums.data ?? [];
  const made = mixes.data ?? [];

  if (recent.length === 0 && mine.length === 0 && shared.length === 0) {
    return (
      <NothingHere
        of={MusicNoteIcon}
        title={say('common.noMusicYet')}
        detail={say('common.onceAMusicLibraryHasBeen3')}
        fills
      />
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-12">
      <MusicFeature newest={recent[0] ?? null} />

      <MixShelf
        heading={
          watching.data === undefined || watching.data === null
            ? say('common.madeForYou')
            : say('screens.musicPage.musicHome.madeForName', { name: watching.data.name })
        }
        mixes={made.filter((mix) => FOR_THEM.has(mix.kind))}
      />

      <MixShelf
        heading={say('screens.musicPage.musicHome.recommendedStations')}
        mixes={made.filter((mix) => mix.kind === 'station')}
      />

      <AlbumShelf
        heading={say('screens.musicPage.musicHome.recents')}
        albums={(played.data ?? []).slice(0, RECENT)}
      />

      <MixShelf
        heading={say('screens.musicPage.musicHome.yourTopMixes')}
        mixes={made.filter((mix) => mix.kind === 'genre' || mix.kind === 'decade')}
      />

      <PlaylistShelf
        heading={say('common.yourPlaylists')}
        playlists={mine}
        action={seeAll({ kind: 'playlists' }, 'playlists')}
      />
    </div>
  );
};

MusicHome.displayName = 'MusicHome';

export { MusicHome };
