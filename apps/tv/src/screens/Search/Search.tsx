import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { CatalogueShelf } from '@ValenceTv/components/CatalogueShelf/CatalogueShelf';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import { MusicShelf } from '@ValenceTv/components/MusicShelf/MusicShelf';
import { albumItem } from '@ValenceTv/music/albumItem';
import { artistItem } from '@ValenceTv/music/artistItem';
import { playlistItem } from '@ValenceTv/music/playlistItem';
import { songItem } from '@ValenceTv/music/songItem';
import { SystemSearch } from '@ValenceTv/components/SystemSearch/SystemSearch';
import { useMayRequest } from '@ValenceTv/requests/useMayRequest';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MusicItem } from '@ValenceTv/music/MusicItem';
import type { SearchProps } from './Search.types';

const SETTLES_AFTER_MS = 300;

const AT_MOST = 60;

const ACROSS = 6;

const WATCHABLE_KINDS = new Set(['film', 'series']);

const FOLLOWED_EVERY_MS = 10_000;

/**
 * Whether a title from the film database is a film or a show, the only kinds a television asks for.
 *
 * @param title - The title.
 * @returns Whether it is one to offer here.
 */
const isWatchable = (title: CatalogueTitle): boolean => WATCHABLE_KINDS.has(title.kind);

/**
 * How often to look again at titles some of which are on their way, so each says where it has got
 * to without being opened; titles none of which are on their way are left alone.
 *
 * @param titles - The titles shown.
 * @returns How long to wait before looking again, or false to not look again.
 */
const followWhileOnTheirWay = (titles: readonly CatalogueTitle[]): number | false =>
  titles.some((title) => title.standing.status === 'requested') ? FOLLOWED_EVERY_MS : false;

/**
 * Search, as the television searches everywhere else: its own keyboard along the top, and beneath
 * it every film and programme whose name matches, a programme once however many episodes match.
 *
 * Where this viewer may ask for what the library lacks, the space beneath the keyboard is not left
 * empty before anything is typed: it holds the shelves of the web's discovery page — what is
 * trending, what is popular, what is coming soon. Once something is typed, the films and shows the
 * film database knows by that name and the library does not have follow the library's own, to be
 * asked for.
 *
 * The server is asked once the typing pauses rather than at every letter, and the answers already
 * shown stay while the next ones are read, so the results do not blink empty between letters. While
 * any title shown is on its way, the shelves and results are looked at again every few seconds, so
 * what each says keeps up with it.
 *
 * @param watchable - The libraries holding something to watch.
 * @param onOpen - Told which title in the library was chosen.
 * @param onAsk - Told which title the library lacks was chosen, to look at and ask for.
 * @param onFeature - Told which picture lights the page: the first poster on its shelves.
 * @param upTo - Where pressing up from the keyboard goes: the bar along the top.
 * @param hasMusic - Whether there is music to search as well: songs, artists, albums and playlists
 *   whose names match follow the films and shows, and choosing a song plays it.
 * @param onOpenMusic - Told which artist, album or playlist was chosen.
 * @param onPlayedMusic - Told once a chosen song has started playing, to show it.
 */
const Search = ({
  watchable,
  onOpen,
  onAsk,
  onFeature,
  upTo,
  hasMusic,
  onOpenMusic,
  onPlayedMusic,
}: SearchProps) => {
  const [typed, setTyped] = useState('');
  const [room, setRoom] = useState<{ width: number; height: number } | null>(null);
  const asked = useSettled(typed.trim(), SETTLES_AFTER_MS);
  const mayRequest = useMayRequest();

  const found = useQuery({
    ...libraryQueries.across(watchable, { search: asked, limit: AT_MOST }),
    enabled: watchable.length > 0 && asked !== '',
    placeholderData: (previous) => previous,
  });

  const discovery = useQuery({
    ...requestsQueries.discover(mayRequest && asked === ''),
    refetchInterval: (query) =>
      followWhileOnTheirWay((query.state.data?.shelves ?? []).flatMap((shelf) => shelf.titles)),
  });

  const films = useQuery({
    ...requestsQueries.askableSearch(asked, 'film', mayRequest && asked !== ''),
    placeholderData: (previous) => previous,
    refetchInterval: (query) => followWhileOnTheirWay(query.state.data ?? []),
  });

  const shows = useQuery({
    ...requestsQueries.askableSearch(asked, 'series', mayRequest && asked !== ''),
    placeholderData: (previous) => previous,
    refetchInterval: (query) => followWhileOnTheirWay(query.state.data ?? []),
  });

  const music = useQuery({
    ...musicQueries.search(asked),
    enabled: hasMusic && asked !== '',
    placeholderData: (previous) => previous,
  });

  const songs = useMemo(() => music.data?.tracks ?? [], [music.data]);
  const songItems = useMemo(() => songs.map(songItem), [songs]);
  const musicShelves = useMemo(
    () =>
      [
        { title: 'Artists', items: (music.data?.artists ?? []).map(artistItem) },
        { title: 'Albums', items: (music.data?.albums ?? []).map(albumItem) },
        { title: 'Playlists', items: (music.data?.playlists ?? []).map(playlistItem) },
      ].filter((shelf) => shelf.items.length > 0),
    [music.data],
  );

  const playSong = useCallback(
    (item: MusicItem) => {
      const at = songs.findIndex((track) => track.id === item.id);

      if (at !== -1) {
        theMusicPlayer().play(songs, at, { source: { kind: 'search', id: null, name: asked } });
        onPlayedMusic();
      }
    },
    [songs, asked, onPlayedMusic],
  );

  const items = useMemo(() => collapseToShows(found.data ?? []), [found.data]);

  const rows = useMemo(
    () =>
      Array.from({ length: Math.ceil(items.length / ACROSS) }, (_, at) =>
        items.slice(at * ACROSS, at * ACROSS + ACROSS),
      ),
    [items],
  );

  const lacking = useMemo(
    () =>
      [...(films.data ?? []), ...(shows.data ?? [])].filter(
        (title) => title.standing.status !== 'library',
      ),
    [films.data, shows.data],
  );

  const shelves = useMemo(
    () =>
      (discovery.data?.shelves ?? [])
        .map((shelf) => ({ ...shelf, titles: shelf.titles.filter(isWatchable) }))
        .filter((shelf) => shelf.titles.length > 0),
    [discovery.data],
  );

  const lead = shelves[0]?.titles[0]?.posterUrl ?? null;

  useEffect(() => {
    onFeature(lead);
  }, [lead, onFeature]);

  const cardWidth =
    room === null
      ? undefined
      : Math.floor((room.width - tokens.space.edge * 2 - tokens.space.md * (ACROSS - 1)) / ACROSS);

  const hasMusicFound = songItems.length > 0 || musicShelves.length > 0;
  const isLooking = asked !== '' && (found.isLoading || music.isLoading);
  const isEmpty =
    asked !== '' && !isLooking && items.length === 0 && lacking.length === 0 && !hasMusicFound;

  return (
    <SystemSearch
      placeholder={hasMusic ? 'Films, shows and music' : 'Films and shows'}
      onChangeText={setTyped}
      onResultsLayout={setRoom}
      upTo={upTo}
    >
      {room === null ? null : (
        <View style={{ width: room.width, height: room.height }}>
          {isLooking ? (
            <View style={styles.middle}>
              <ActivityIndicator size="large" color={tokens.colours.text} />
            </View>
          ) : isEmpty ? (
            <View style={styles.middle}>
              <Text style={styles.nothing}>Nothing called “{asked}” here.</Text>
            </View>
          ) : (
            <ScrollView
              style={{ height: room.height }}
              contentContainerStyle={styles.inside}
              showsVerticalScrollIndicator={false}
            >
              {asked === ''
                ? shelves.map((shelf) => (
                    <CatalogueShelf
                      key={shelf.id}
                      title={shelf.title}
                      titles={shelf.titles}
                      onOpen={onAsk}
                    />
                  ))
                : null}

              {rows.length === 0 ? null : (
                <View style={styles.grid}>
                  {lacking.length === 0 ? null : (
                    <Text style={styles.heading}>In your library</Text>
                  )}

                  {rows.map((row) => (
                    <View key={row[0]?.id ?? 'row'} style={styles.row}>
                      {row.map((media) => (
                        <MediaCard
                          key={media.id}
                          media={media}
                          shape="poster"
                          {...(cardWidth === undefined ? {} : { width: cardWidth })}
                          onPress={onOpen}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {asked === '' || songItems.length === 0 ? null : (
                <MusicShelf title="Songs" items={songItems} onOpen={playSong} />
              )}

              {asked === ''
                ? null
                : musicShelves.map((shelf) => (
                    <MusicShelf
                      key={shelf.title}
                      title={shelf.title}
                      items={shelf.items}
                      onOpen={onOpenMusic}
                    />
                  ))}

              {asked === '' || lacking.length === 0 ? null : (
                <CatalogueShelf title="Not in your library yet" titles={lacking} onOpen={onAsk} />
              )}
            </ScrollView>
          )}
        </View>
      )}
    </SystemSearch>
  );
};

Search.displayName = 'Search';

const styles = StyleSheet.create({
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nothing: { color: tokens.colours.muted, fontSize: tokens.type.body },
  inside: { paddingVertical: tokens.space.lg, gap: tokens.space.lg },
  grid: { paddingHorizontal: tokens.space.edge, gap: tokens.space.lg },
  heading: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  row: { flexDirection: 'row', gap: tokens.space.md },
});

export { Search };
