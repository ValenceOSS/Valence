import { Film, Monitor, SearchX } from '@keyline-icons/react-native';
import {
  Film as FilmFilled,
  Home as HomeFilled,
  Monitor as MonitorFilled,
  BookOpen as BookOpenFilled,
  MusicNote as MusicNoteFilled,
} from '@keyline-icons/react-native/fill';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { howToFillIt } from '@ValenceClient/library/howToFillIt';
import { useLibraryFilters } from '@ValenceClient/library/useLibraryFilters';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { ANothingHere } from '@ValencePhone/components/ANothingHere/ANothingHere';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { APosterGrid } from '@ValencePhone/components/APosterGrid/APosterGrid';
import { Button } from '@ValencePhone/components/Button/Button';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValencePhone/components/Words/Words';
import { ACard } from '@ValencePhone/components/ACard/ACard';
import { AMoodBackground } from '@ValencePhone/components/AMoodBackground/AMoodBackground';
import { TheBell } from '@ValencePhone/components/TheBell/TheBell';
import { ACarriedMark } from '@ValencePhone/components/ACarriedMark/ACarriedMark';
import { TheFilters } from '@ValencePhone/components/TheLibrary/components/TheFilters/TheFilters';
import { TheHome } from '@ValencePhone/components/TheLibrary/components/TheHome/TheHome';
import { TheBooks } from '@ValencePhone/components/TheLibrary/components/TheBooks/TheBooks';
import { TheMusic } from '@ValencePhone/components/TheLibrary/components/TheMusic/TheMusic';
import { TheClipBehind } from '@ValencePhone/components/TheLibrary/components/TheClipBehind/TheClipBehind';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useArtworkLights } from '@ValencePhone/hooks/useArtworkLights';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { AnArrival } from '@ValencePhone/components/AnArrival/AnArrival';
import { ARRIVING } from '@ValencePhone/components/AnArrival/ARRIVING';
import { SPRINGS } from '@ValencePhone/theme/SPRINGS';
import { IS_ON_TOP } from '@ValencePhone/components/APageStack/IS_ON_TOP';
import { useIsOnTop } from '@ValencePhone/hooks/useIsOnTop';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ABlur } from '@ValencePhone/components/ABlur/ABlur';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { theColours } from '@ValencePhone/theme/theColours';
import type { ReactNode } from 'react';
import type { VideoPlayer } from 'expo-video';
import type { ALight } from '@ValencePhone/components/AMoodBackground/AMoodBackground.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';
import type { TheLibraryProps } from './TheLibrary.types';

type Cell = { kind: 'media'; media: MediaSummary } | { kind: 'programme'; programme: ShowSummary };

const EVERY = 'every';

const NO_LIGHTS: ALight[] = [];

const BAR_TALL = 50;

const UNDER_THE_BAR = 10;

const ARRIVES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: true } as const;

const styles = StyleSheet.create({
  arriving: { gap: 20 },
  hidden: { display: 'none' },
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: UNDER_THE_BAR,
    paddingHorizontal: SCREEN_EDGE,
  },
  edge: { bottom: 0, height: StyleSheet.hairlineWidth, left: 0, position: 'absolute', right: 0 },
  fixed: { left: 0, position: 'absolute', right: 0, top: 0 },
  lit: { flex: 1 },
  parts: { flex: 1, paddingLeft: 6 },
});

/**
 * What is in this household's libraries, laid out as the web's are: a home page of shelves, and
 * films and programmes each as a grid of their own, over the web's lights — coloured on the home
 * page by its hero's backdrop, with the hero's clip itself blurred behind the page while it plays,
 * and the house colours elsewhere.
 *
 * Films and programmes each take the web's filters, and where there is more than one library of a
 * kind, a choice of which, and music is offered as the web offers it, from its albums, artists and
 * playlists, and books as the web offers them, what somebody is part way through first.
 *
 * Programmes are read as the list of programmes while nothing is filtered, which is one request,
 * and as their episodes gathered into programmes once something is, since genre and year belong to
 * the episodes.
 *
 * @param onWatch - Told to play something, and from where.
 * @param onLookAt - Told which title somebody wants to see more of.
 * @param onLookAtShow - Told which programme, in which library.
 * @param onNotifications - Told somebody wants to see what the server has told them.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist.
 * @param onLiked - Told to open the songs this profile has liked.
 * @param onAllAlbums - Told somebody wants every album.
 * @param onAllArtists - Told somebody wants every artist.
 * @param onBook - Told to open a book.
 * @param onRead - Told to carry on reading a book.
 */
const TheLibrary = ({
  onWatch,
  onLookAt,
  onLookAtShow,
  onNotifications,
  onAlbum,
  onArtist,
  onPlaylist,
  onLiked,
  onAllAlbums,
  onAllArtists,
  onBook,
  onRead,
}: TheLibraryProps) => {
  const colours = useTheColours();
  const libraries = useQuery(libraryQueries.all());
  const watched = useQuery(viewingQueries.progress());
  const filters = useLibraryFilters();
  const [part, setPart] = useState('home');
  const [barTall, setBarTall] = useState(BAR_TALL);
  const [scrolled, setScrolled] = useState<Readonly<Record<string, boolean>>>({});
  const isPast = scrolled[part] === true;
  const room = useSafeAreaInsets();
  const [arriving] = useState(() => new Animated.Value(0));
  const isOnTop = useIsOnTop();

  useLayoutEffect(() => {
    Animated.spring(arriving, { ...ARRIVES, toValue: 0 }).start();
  }, [part, arriving]);
  const [chosen, setChosen] = useState(EVERY);
  const [heroic, setHeroic] = useState<string | null>(null);
  const [clip, setClip] = useState<VideoPlayer | null>(null);
  const backdrop = useArtworkLights(part === 'home' ? heroic : null);
  const palette = part === 'home' ? backdrop : NO_LIGHTS;
  const onShowing = useCallback((media: MediaSummary | null) => {
    setHeroic(media !== null && media.hasBackdrop ? media.id : null);
  }, []);
  const howFar = byMediaId(watched.data ?? []);
  const films = (libraries.data ?? []).filter((library) => library.kind === 'movies');
  const programmes = (libraries.data ?? []).filter((library) => library.kind === 'shows');
  const hasMusic = (libraries.data ?? []).some((library) => library.kind === 'music');
  const bookLibraries = (libraries.data ?? [])
    .filter((library) => library.kind === 'books')
    .map((library) => library.id);
  const drawsItsOwn = part === 'home' || part === 'music' || part === 'books';
  const watchable = [...films, ...programmes].map((library) => library.id);
  const ofThisKind = part === 'films' ? films : part === 'shows' ? programmes : [];
  const reading = chosen === EVERY ? ofThisKind.map((library) => library.id) : [chosen];
  const isFiltered = filters.selected.size > 0;
  const parts = [
    { id: 'home', label: 'Home', icon: HomeFilled },
    ...(films.length > 0 ? [{ id: 'films', label: 'Films', icon: FilmFilled }] : []),
    ...(programmes.length > 0 ? [{ id: 'shows', label: 'Shows', icon: MonitorFilled }] : []),
    ...(hasMusic ? [{ id: 'music', label: 'Music', icon: MusicNoteFilled }] : []),
    ...(bookLibraries.length > 0 ? [{ id: 'books', label: 'Books', icon: BookOpenFilled }] : []),
  ];

  const everything = useQuery({
    ...libraryQueries.everything(reading, {
      kind: part === 'shows' ? 'shows' : 'films',
      ...filters.asked,
    }),
    enabled: reading.length > 0 && (part === 'films' || isFiltered),
  });
  const programmeLists = useQueries({
    queries: reading.map((libraryId) => ({
      ...libraryQueries.shows(libraryId),
      enabled: part === 'shows' && !isFiltered,
    })),
  });

  const cells: readonly Cell[] =
    part === 'home'
      ? []
      : part === 'shows' && !isFiltered
        ? programmeLists
            .flatMap((list) => list.data ?? [])
            .sort((left, right) => left.title.localeCompare(right.title))
            .map((programme) => ({ kind: 'programme', programme }))
        : (part === 'shows' ? collapseToShows(everything.data ?? []) : (everything.data ?? [])).map(
            (media) => ({ kind: 'media', media }),
          );
  const isWaiting =
    part === 'shows' && !isFiltered
      ? programmeLists.some((list) => list.isPending)
      : everything.isPending && everything.fetchStatus !== 'idle';

  /**
   * Draws a part of the library over its lights: on the home page, the colours of the hero's
   * backdrop and, while its clip plays, the clip itself blurred behind everything; the house colours
   * everywhere else.
   *
   * @param drawn - The part.
   * @returns It, lit.
   */
  const lit = (drawn: ReactNode) => (
    <View style={[styles.lit, { backgroundColor: colours.surface }]}>
      <TheClipBehind player={part === 'home' ? clip : null}>
        <AMoodBackground palette={palette} />
      </TheClipBehind>
      <ARRIVING.Provider value={arriving}>{drawn}</ARRIVING.Provider>
      {bar}
    </View>
  );

  const bar = (
    <View style={[styles.fixed, { paddingTop: room.top + SCREEN_EDGE }]}>
      <ABlur isDark={colours.surface === theColours.dark.surface} isOn={isPast} changesOver={250} />
      <View style={[styles.edge, { backgroundColor: colours.border, opacity: isPast ? 1 : 0 }]} />
      <View
        style={styles.bar}
        onLayout={({ nativeEvent }) => {
          setBarTall(nativeEvent.layout.height);
        }}
      >
        <ACarriedMark isHandedOn={false} />
        <View style={styles.parts}>
          <SegmentedRow
            label="What to show"
            isGlass
            scrolls
            items={parts}
            value={part}
            onSelect={(next) => {
              if (next === part) {
                return;
              }

              const from = parts.findIndex((one) => one.id === part);
              const to = parts.findIndex((one) => one.id === next);

              arriving.setValue(to > from ? 1 : -1);
              setPart(next);
              setChosen(EVERY);
              filters.clear();
            }}
          />
        </View>
        <TheBell onPress={onNotifications} />
      </View>
    </View>
  );

  /**
   * Notes whether a part has been scrolled from its top, which is what brings the bar's blur in.
   *
   * @param which - The part.
   * @returns What to tell the part to call as it scrolls.
   */
  const noteScrolling = (which: string) => (isScrolled: boolean) => {
    setScrolled((was) => (was[which] === isScrolled ? was : { ...was, [which]: isScrolled }));
  };

  const header = (
    <>
      <View style={{ height: barTall - UNDER_THE_BAR }} />

      {!libraries.isError && !isWaiting && drawsItsOwn ? null : (
        <AnArrival style={styles.arriving}>
          {libraries.isError ? <Words tone="danger">Those could not be read.</Words> : null}

          {ofThisKind.length > 1 ? (
            <SegmentedRow
              label="Which library"
              items={[
                { id: EVERY, label: 'All' },
                ...ofThisKind.map((library) => ({ id: library.id, label: library.name })),
              ]}
              value={chosen}
              onSelect={setChosen}
            />
          ) : null}

          {drawsItsOwn ? null : (
            <TheFilters
              groups={filters.groups}
              selected={filters.selected}
              onChange={filters.change}
              onClear={filters.clear}
            />
          )}

          {isWaiting ? <ActivityIndicator color={colours.textMuted} /> : null}

          {!drawsItsOwn && !isWaiting && cells.length === 0 ? (
            isFiltered ? (
              <ANothingHere
                of={SearchX}
                title="Nothing matches those"
                detail="Try fewer filters, or clear them."
              />
            ) : (
              <ANothingHere
                of={part === 'films' ? Film : Monitor}
                title={part === 'films' ? 'No films yet' : 'No shows yet'}
                detail={howToFillIt(
                  chosen === EVERY && ofThisKind.length > 1 ? 'every library' : 'one library',
                  false,
                )}
              />
            )
          ) : null}
        </AnArrival>
      )}
    </>
  );

  const home = (
    <View
      style={[StyleSheet.absoluteFill, part === 'home' ? null : styles.hidden]}
      pointerEvents={part === 'home' ? 'auto' : 'none'}
      accessibilityElementsHidden={part !== 'home'}
      importantForAccessibility={part === 'home' ? 'auto' : 'no-hide-descendants'}
    >
      <IS_ON_TOP.Provider value={isOnTop && part === 'home'}>
        <TheHome
          header={header}
          watchable={watchable}
          librariesAre={
            libraries.data === undefined
              ? 'reading'
              : libraries.data.length === 0
                ? 'missing'
                : 'there'
          }
          onWatch={onWatch}
          onLookAt={onLookAt}
          onLookAtShow={onLookAtShow}
          onShowing={onShowing}
          onClip={setClip}
          onScrolled={noteScrolling('home')}
        />
      </IS_ON_TOP.Provider>
    </View>
  );

  return lit(
    <>
      {home}
      {part === 'home' ? null : part === 'books' ? (
        <TheBooks
          header={header}
          libraryIds={bookLibraries}
          onBook={onBook}
          onRead={onRead}
          onScrolled={noteScrolling('books')}
        />
      ) : part === 'music' ? (
        <TheMusic
          header={header}
          onAlbum={onAlbum}
          onArtist={onArtist}
          onPlaylist={onPlaylist}
          onLiked={onLiked}
          onAllAlbums={onAllAlbums}
          onAllArtists={onAllArtists}
          onScrolled={noteScrolling('music')}
        />
      ) : (
        <APosterGrid
          header={header}
          items={cells}
          onScrolled={noteScrolling(part)}
          keyOf={(cell) => (cell.kind === 'media' ? cell.media.id : cell.programme.id)}
          drawn={(cell) => {
            if (cell.kind === 'programme') {
              return (
                <Button
                  tone="bare"
                  label={cell.programme.title}
                  onPress={() => {
                    onLookAtShow(cell.programme.libraryId, cell.programme.id);
                  }}
                >
                  <APoster
                    title={cell.programme.title}
                    year={cell.programme.year ?? null}
                    artwork={onThisServer(`/api/media/${cell.programme.coverMediaId}/image/poster`)}
                  />
                </Button>
              );
            }

            const known = howFar.get(cell.media.id);

            return (
              <ACard
                media={cell.media}
                asProgramme={part === 'shows'}
                watched={known === undefined ? 0 : watchedFraction(known)}
                onLookAt={onLookAt}
                onLookAtShow={onLookAtShow}
              />
            );
          }}
        />
      )}
    </>,
  );
};

TheLibrary.displayName = 'TheLibrary';

export { TheLibrary };
