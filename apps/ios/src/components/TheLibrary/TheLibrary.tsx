import { Film, Monitor, ScanQrCode, SearchX } from '@keyline-icons/react-native';
import {
  Film as FilmFilled,
  Home as HomeFilled,
  Monitor as MonitorFilled,
  BookOpen as BookOpenFilled,
  MusicNote as MusicNoteFilled,
} from '@keyline-icons/react-native/fill';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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
import { AGlassCircle } from '@ValencePhone/components/AGlassCircle/AGlassCircle';
import { AMoodBackground } from '@ValencePhone/components/AMoodBackground/AMoodBackground';
import { TheSearchBox } from '@ValencePhone/components/TheSearch/components/TheSearchBox/TheSearchBox';
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
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';
import type { TheLibraryProps } from './TheLibrary.types';

type Cell = { kind: 'media'; media: MediaSummary } | { kind: 'programme'; programme: ShowSummary };

const EVERY = 'every';

const NO_LIGHTS: ALight[] = [];

const BAR_TALL = 50;

const UNDER_THE_BAR = 10;

const ARRIVES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: true } as const;

const NO_LIBRARIES: readonly Library[] = [];

/**
 * Keeps only what the grid reads from the programme lists — each list, and whether any is still
 * being read — so it stays the same object until one of those changes.
 *
 * @param results - The lists, as asked for.
 * @returns Each list, and whether any is still being read.
 */
const programmesOf = (
  results: readonly { data: ShowSummary[] | undefined; isPending: boolean }[],
): { lists: (ShowSummary[] | undefined)[]; isPending: boolean } => ({
  lists: results.map(({ data }) => data),
  isPending: results.some(({ isPending }) => isPending),
});

const SEARCH = 'search';

/**
 * Notes whether a part has been scrolled from its top, which is what brings the bar's blur in.
 *
 * @param was - What was noted of every part.
 * @param which - The part.
 * @param isScrolled - Whether it has been scrolled from its top.
 * @returns What is noted now, the same record where nothing changed.
 */
const noteScrolled = (
  was: Readonly<Record<string, boolean>>,
  which: string,
  isScrolled: boolean,
): Readonly<Record<string, boolean>> =>
  was[which] === isScrolled ? was : { ...was, [which]: isScrolled };

/**
 * What a cell of the grid is known by.
 *
 * @param cell - The cell.
 * @returns Its key.
 */
const keyOfCell = (cell: Cell): string =>
  cell.kind === 'media' ? cell.media.id : cell.programme.id;

const BAR_MOVES_OVER = 260;

const BAR_TURNS_AFTER = 10;

const BAR_LIFTS_BY = 24;

const PARTS_BELOW_BY = 12;

const styles = StyleSheet.create({
  dimmed: { backgroundColor: 'rgba(0, 0, 0, 0.28)' },
  arriving: { gap: 20 },
  hidden: { opacity: 0 },
  aside: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  bar: {
    gap: PARTS_BELOW_BY,
    paddingBottom: UNDER_THE_BAR,
    paddingHorizontal: SCREEN_EDGE,
  },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  edge: { bottom: 0, height: StyleSheet.hairlineWidth, left: 0, position: 'absolute', right: 0 },
  fixed: { left: 0, position: 'absolute', right: 0, top: 0 },
  lit: { flex: 1 },
  parts: { alignSelf: 'stretch' },
  searchInstead: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
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
 * @param onScan - Told somebody wants to scan a television's code to sign it in.
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
  onScan,
  onAlbum,
  onArtist,
  onPlaylist,
  onLiked,
  onAllAlbums,
  onAllArtists,
  onBook,
  onRead,
  isSearching = false,
  searchPage,
}: TheLibraryProps) => {
  const colours = useTheColours();
  const told = useRef({ onWatch, onLookAt, onLookAtShow });
  const libraries = useQuery(libraryQueries.all());
  const watched = useQuery(viewingQueries.progress());
  const filters = useLibraryFilters();
  const [part, setPart] = useState('home');
  const [barTall, setBarTall] = useState(BAR_TALL);
  const [barAway] = useState(() => new Animated.Value(0));
  const [isBarAway, setIsBarAway] = useState(false);
  const [partsTall, setPartsTall] = useState(0);
  const [searchingFor, setSearchingFor] = useState('');
  const [hasSearched, setHasSearched] = useState(isSearching);
  const { width: wide } = useWindowDimensions();

  useEffect(() => {
    if (isSearching) {
      setHasSearched(true);
    }
  }, [isSearching]);
  const [searchness] = useState(() => new Animated.Value(isSearching ? 1 : 0));

  useEffect(() => {
    setIsBarAway(false);
    Animated.timing(searchness, {
      toValue: isSearching ? 1 : 0,
      duration: BAR_MOVES_OVER,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isSearching, searchness]);
  const turnedAt = useRef(0);
  const isAway = isBarAway && !isSearching;
  const searching = useRef(isSearching);

  useLayoutEffect(() => {
    searching.current = isSearching;
  }, [isSearching]);

  useEffect(() => {
    Animated.timing(barAway, {
      toValue: isAway ? 1 : 0,
      duration: BAR_MOVES_OVER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isAway, barAway]);

  const followScroll = useCallback(
    (y: number) => {
      if (searching.current) {
        return;
      }

      if (y < barTall) {
        turnedAt.current = y;
        setIsBarAway(false);

        return;
      }

      if (y - turnedAt.current > BAR_TURNS_AFTER) {
        turnedAt.current = y;
        setIsBarAway(true);
      } else if (turnedAt.current - y > BAR_TURNS_AFTER) {
        turnedAt.current = y;
        setIsBarAway(false);
      } else if (isBarAway ? y > turnedAt.current : y < turnedAt.current) {
        turnedAt.current = y;
      }
    },
    [barTall, isBarAway],
  );
  const [scrolled, setScrolled] = useState<Readonly<Record<string, boolean>>>({});
  const isPast = scrolled[isSearching ? SEARCH : part] === true;
  const room = useSafeAreaInsets();
  const [arriving] = useState(() => new Animated.Value(0));
  const isOnTop = useIsOnTop();

  useLayoutEffect(() => {
    told.current = { onWatch, onLookAt, onLookAtShow };
  });

  useLayoutEffect(() => {
    Animated.spring(arriving, { ...ARRIVES, toValue: 0 }).start();
  }, [part, arriving]);

  const watch = useCallback((mediaId: string, startSeconds: number) => {
    told.current.onWatch(mediaId, startSeconds);
  }, []);
  const lookAt = useCallback((mediaId: string) => {
    told.current.onLookAt(mediaId);
  }, []);
  const lookAtShow = useCallback((libraryId: string, showId: string) => {
    told.current.onLookAtShow(libraryId, showId);
  }, []);
  const [chosen, setChosen] = useState(EVERY);
  const [heroic, setHeroic] = useState<string | null>(null);
  const [clip, setClip] = useState<VideoPlayer | null>(null);
  const backdrop = useArtworkLights(part === 'home' ? heroic : null);
  const palette = part === 'home' ? backdrop : NO_LIGHTS;
  const onShowing = useCallback((media: MediaSummary | null) => {
    setHeroic(media !== null && media.hasBackdrop ? media.id : null);
  }, []);
  const howFar = useMemo(() => byMediaId(watched.data ?? []), [watched.data]);
  const { films, programmes, hasMusic, bookLibraries, watchable } = useMemo(() => {
    const every = libraries.data ?? NO_LIBRARIES;
    const filmLibraries = every.filter((library) => library.kind === 'movies');
    const programmeLibraries = every.filter((library) => library.kind === 'shows');

    return {
      films: filmLibraries,
      programmes: programmeLibraries,
      hasMusic: every.some((library) => library.kind === 'music'),
      bookLibraries: every
        .filter((library) => library.kind === 'books')
        .map((library) => library.id),
      watchable: [...filmLibraries, ...programmeLibraries].map((library) => library.id),
    };
  }, [libraries.data]);
  const drawsItsOwn = part === 'home' || part === 'music' || part === 'books';
  const ofThisKind = useMemo(
    () => (part === 'films' ? films : part === 'shows' ? programmes : NO_LIBRARIES),
    [part, films, programmes],
  );
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
    combine: programmesOf,
  });

  const cells = useMemo(
    (): readonly Cell[] =>
      part === 'home'
        ? []
        : part === 'shows' && !isFiltered
          ? programmeLists.lists
              .flatMap((list) => list ?? [])
              .sort((left, right) => left.title.localeCompare(right.title))
              .map((programme) => ({ kind: 'programme', programme }))
          : (part === 'shows'
              ? collapseToShows(everything.data ?? [])
              : (everything.data ?? [])
            ).map((media) => ({ kind: 'media', media })),
    [part, isFiltered, programmeLists.lists, everything.data],
  );
  const isWaiting =
    part === 'shows' && !isFiltered
      ? programmeLists.isPending
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
      <View style={[StyleSheet.absoluteFill, styles.dimmed]} pointerEvents="none" />
      <ARRIVING.Provider value={arriving}>{drawn}</ARRIVING.Provider>
      {bar}
    </View>
  );

  const bar = (
    <View style={[styles.fixed, { paddingTop: room.top + SCREEN_EDGE }]} pointerEvents="box-none">
      <Animated.View
        collapsable={false}
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateY: barAway.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -partsTall],
                }),
              },
            ],
          },
        ]}
      >
        <ABlur
          isDark={colours.surface === theColours.dark.surface}
          isOn={isPast}
          changesOver={250}
        />
        <View style={[styles.edge, { backgroundColor: colours.border, opacity: isPast ? 1 : 0 }]} />
      </Animated.View>
      <View
        style={styles.bar}
        pointerEvents="box-none"
        onLayout={({ nativeEvent }) => {
          setBarTall(nativeEvent.layout.height);
        }}
      >
        <View style={styles.topRow}>
          <ACarriedMark isHandedOn={false} />
          <View style={styles.aside}>
            <AGlassCircle of={ScanQrCode} label="Sign in a television" onPress={onScan} />
            <TheBell onPress={onNotifications} />
          </View>
        </View>
        <Animated.View
          collapsable={false}
          pointerEvents={isAway ? 'none' : 'auto'}
          onLayout={({ nativeEvent }) => {
            setPartsTall(nativeEvent.layout.height + PARTS_BELOW_BY);
          }}
          style={[
            styles.parts,
            {
              transform: [
                {
                  translateY: barAway.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -BAR_LIFTS_BY],
                  }),
                },
              ],
            },
          ]}
        >
          <View pointerEvents={isSearching ? 'none' : 'auto'}>
            <SegmentedRow
              label="What to show"
              fills
              isShown={!isSearching && !isBarAway}
              items={parts}
              value={part}
              onSelect={(next) => {
                if (next === part) {
                  return;
                }

                const from = parts.findIndex((one) => one.id === part);
                const to = parts.findIndex((one) => one.id === next);

                arriving.setValue(to > from ? 1 : -1);
                setIsBarAway(false);
                turnedAt.current = 0;
                setPart(next);
                setChosen(EVERY);
                filters.clear();
              }}
            />
          </View>
          <View pointerEvents={isSearching ? 'auto' : 'none'} style={styles.searchInstead}>
            <TheSearchBox
              placeholder="Films, programmes, people"
              onSettle={setSearchingFor}
              isCapsule
              isShown={isSearching}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );

  const searchScrolled = useCallback((isScrolled: boolean) => {
    setScrolled((was) => noteScrolled(was, SEARCH, isScrolled));
  }, []);

  const homeScrolled = useCallback((isScrolled: boolean) => {
    setScrolled((was) => noteScrolled(was, 'home', isScrolled));
  }, []);
  const partScrolled = useCallback(
    (isScrolled: boolean) => {
      setScrolled((was) => noteScrolled(was, part, isScrolled));
    },
    [part],
  );

  const header = useMemo(
    () => (
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
    ),
    [
      barTall,
      libraries.isError,
      isWaiting,
      drawsItsOwn,
      ofThisKind,
      chosen,
      filters.groups,
      filters.selected,
      filters.change,
      filters.clear,
      colours.textMuted,
      cells.length,
      isFiltered,
      part,
    ],
  );

  const drawn = useCallback(
    (cell: Cell, wide: number) => {
      if (cell.kind === 'programme') {
        return (
          <Button
            tone="bare"
            label={cell.programme.title}
            onPress={() => {
              lookAtShow(cell.programme.libraryId, cell.programme.id);
            }}
          >
            <APoster
              title={cell.programme.title}
              year={cell.programme.year ?? null}
              artwork={onThisServer(`/api/media/${cell.programme.coverMediaId}/image/poster`)}
              wide={wide}
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
          wide={wide}
          onLookAt={lookAt}
          onLookAtShow={lookAtShow}
        />
      );
    },
    [howFar, part, lookAt, lookAtShow],
  );

  const isHomeSeen = part === 'home';

  const home = (
    <View
      collapsable={false}
      style={[StyleSheet.absoluteFill, isHomeSeen ? null : styles.hidden]}
      pointerEvents={isHomeSeen ? 'auto' : 'none'}
      accessibilityElementsHidden={!isHomeSeen || isSearching}
      importantForAccessibility={isHomeSeen && !isSearching ? 'auto' : 'no-hide-descendants'}
    >
      <IS_ON_TOP.Provider value={isOnTop && part === 'home'}>
        <TheHome
          header={header}
          isOnScreen={part === 'home'}
          watchable={watchable}
          librariesAre={
            libraries.data === undefined
              ? 'reading'
              : libraries.data.length === 0
                ? 'missing'
                : 'there'
          }
          onWatch={watch}
          onLookAt={lookAt}
          onLookAtShow={lookAtShow}
          onShowing={onShowing}
          onClip={setClip}
          onScrolled={homeScrolled}
          onScrolledTo={followScroll}
        />
      </IS_ON_TOP.Provider>
    </View>
  );

  return lit(
    <>
      <Animated.View
        collapsable={false}
        pointerEvents={isSearching ? 'none' : 'box-none'}
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateX: searchness.interpolate({ inputRange: [0, 1], outputRange: [0, -wide] }),
              },
            ],
          },
        ]}
      >
        {home}
        {part === 'home' ? null : part === 'books' ? (
          <TheBooks
            header={header}
            libraryIds={bookLibraries}
            onBook={onBook}
            onRead={onRead}
            onScrolled={partScrolled}
            onScrolledTo={followScroll}
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
            onScrolled={partScrolled}
          />
        ) : (
          <APosterGrid
            header={header}
            items={cells}
            onScrolled={partScrolled}
            onScrolledTo={followScroll}
            keyOf={keyOfCell}
            drawn={drawn}
          />
        )}
      </Animated.View>

      {hasSearched ? (
        <Animated.View
          collapsable={false}
          pointerEvents={isSearching ? 'box-none' : 'none'}
          accessibilityElementsHidden={!isSearching}
          importantForAccessibility={isSearching ? 'auto' : 'no-hide-descendants'}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: searchness.interpolate({
                    inputRange: [0, 1],
                    outputRange: [wide, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {searchPage?.(
            <View style={{ height: barTall - UNDER_THE_BAR }} />,
            searchingFor,
            searchScrolled,
          )}
        </Animated.View>
      ) : null}
    </>,
  );
};

TheLibrary.displayName = 'TheLibrary';

export { TheLibrary };
