import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { TextField } from '@ValenceUI/TextField';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { ArtistShelf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { PlaylistShelf } from '@ValenceScreens/components/PlaylistShelf/PlaylistShelf';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { writeMusicView } from '@ValenceClient/music/musicView';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import type { MusicSearchViewProps } from './MusicSearchView.types';
import { say } from '@ValenceI18n/say';

const SETTLE_MS = 250;

/**
 * Searching the music: one box, and songs, artists, albums and playlists under it as they match.
 *
 * What is typed goes into the address once somebody pauses, so a search can be gone back to and
 * the back button does not step through it a letter at a time. Before anything is typed, every
 * album is shown by title, which is the other way people look for a record.
 *
 * @param query - What the address says was searched for.
 */
const MusicSearchView = ({ query }: MusicSearchViewProps) => {
  const { replace } = usePlace();
  const { player } = useMusicPlayer();
  const [typed, setTyped] = useState(query);
  const asked = useQuery(musicQueries.search(query));
  const everything = useQuery({ ...musicQueries.albums('title'), enabled: query.trim() === '' });

  useLightTheMusic(null);

  useEffect(() => {
    if (typed === query) {
      return;
    }

    const timer = setTimeout(() => {
      replace({ listen: writeMusicView({ kind: 'search', query: typed }) });
    }, SETTLE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [typed, query, replace]);

  const found = asked.data;
  const isEmpty =
    found !== undefined &&
    found.tracks.length + found.albums.length + found.artists.length + found.playlists.length === 0;

  return (
    <div className="flex flex-col gap-12 pt-2 pb-12">
      <div className={MUSIC_LANES.page}>
        <TextField
          label={say('screens.musicSearchView.searchLabel')}
          isLabelHidden
          type="search"
          size="lg"
          hasFocusOnMount
          placeholder={say('screens.musicSearchView.placeholder')}
          icon={<Icon of={SearchIcon} size={18} />}
          value={typed}
          onValueChange={setTyped}
          className="max-w-2xl"
        />
      </div>

      {query.trim() === '' ? (
        everything.isPending ? (
          <div className={MUSIC_LANES.page}>
            <Skeleton
              label={say('screens.musicSearchView.readingEverything')}
              className="h-48 w-full"
            />
          </div>
        ) : (
          <AlbumShelf
            heading={say('screens.musicSearchView.everyAlbum')}
            layout="grid"
            albums={everything.data ?? []}
          />
        )
      ) : asked.isPending ? (
        <div className={MUSIC_LANES.page}>
          <Skeleton label={say('screens.musicSearchView.searching')} className="h-48 w-full" />
        </div>
      ) : isEmpty ? (
        <NothingHere
          of={SearchIcon}
          title={say('common.nothingMatches', { query })}
          detail={say('screens.musicSearchView.tryFewerWords')}
        />
      ) : (
        <>
          {(found?.tracks ?? []).length === 0 ? null : (
            <section
              aria-label={say('screens.musicSearchView.songs')}
              className={`flex flex-col gap-3 ${MUSIC_LANES.tracks}`}
            >
              <h2 className="px-3 text-lg font-semibold tracking-tight text-text">
                {say('screens.musicSearchView.songs')}
              </h2>
              <TrackList
                label={say('screens.musicSearchView.songsMatching', { query })}
                tracks={found?.tracks ?? []}
                showsArtwork
                onPlay={(index) => {
                  player.play(found?.tracks ?? [], index, {
                    source: { kind: 'search', id: null, name: `“${query}”` },
                  });
                }}
              />
            </section>
          )}
          <ArtistShelf
            heading={say('screens.musicSearchView.artists')}
            artists={found?.artists ?? []}
          />
          <AlbumShelf
            heading={say('screens.musicSearchView.albums')}
            albums={found?.albums ?? []}
          />
          <PlaylistShelf
            heading={say('screens.musicSearchView.playlists')}
            playlists={found?.playlists ?? []}
          />
        </>
      )}
    </div>
  );
};

MusicSearchView.displayName = 'MusicSearchView';

export { MusicSearchView };
