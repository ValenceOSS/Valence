import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { TextField } from '@ValenceUI/TextField';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AlbumShelf } from '@ValenceScreens/components/AlbumShelf/AlbumShelf';
import { ArtistShelf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { PlaylistShelf } from '@ValenceScreens/components/PlaylistShelf/PlaylistShelf';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { writeMusicView } from '@ValenceScreens/music/musicView';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { MusicSearchViewProps } from './MusicSearchView.types';

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
    <div className="flex flex-col gap-8 px-3 pt-6 pb-12 sm:px-5">
      <div className="px-2">
        <TextField
          label="Search music"
          isLabelHidden
          type="search"
          size="lg"
          hasFocusOnMount
          placeholder="What do you want to listen to?"
          icon={<Icon of={Search01Icon} size={18} />}
          value={typed}
          onValueChange={setTyped}
          className="max-w-2xl"
        />
      </div>

      {query.trim() === '' ? (
        everything.isPending ? (
          <Skeleton label="Reading every album" className="h-48 w-full" />
        ) : (
          <AlbumShelf heading="Every album" albums={everything.data ?? []} />
        )
      ) : asked.isPending ? (
        <Skeleton label="Searching" className="h-48 w-full" />
      ) : isEmpty ? (
        <NothingHere
          of={Search01Icon}
          title={`Nothing matches “${query}”`}
          detail="Try fewer words."
        />
      ) : (
        <>
          {(found?.tracks ?? []).length === 0 ? null : (
            <section aria-label="Songs" className="flex flex-col gap-3">
              <h2 className="px-2 text-xl font-bold tracking-tight text-text">Songs</h2>
              <TrackList
                label={`Songs matching ${query}`}
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
          <ArtistShelf heading="Artists" artists={found?.artists ?? []} />
          <AlbumShelf heading="Albums" albums={found?.albums ?? []} />
          <PlaylistShelf heading="Playlists" playlists={found?.playlists ?? []} />
        </>
      )}
    </div>
  );
};

MusicSearchView.displayName = 'MusicSearchView';

export { MusicSearchView };
