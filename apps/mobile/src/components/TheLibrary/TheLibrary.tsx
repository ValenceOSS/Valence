import { Calendar, Film, Inbox, Monitor, ScanQrCode, SearchX } from '@keyline-icons/react-native';
import {
  Film as FilmFilled,
  Home as HomeFilled,
  Monitor as MonitorFilled,
  BookOpen as BookOpenFilled,
  MusicNote as MusicNoteFilled,
} from '@keyline-icons/react-native/fill';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { arrangeForBrowsing } from '@ValenceClient/library/arrangeForBrowsing';
import {
  readBrowseArrangement,
  saveBrowseArrangement,
} from '@ValenceClient/library/browseArrangementPreference';
import { unwatchedByShow } from '@ValenceClient/library/unwatchedByShow';
import { howToFillIt } from '@ValenceClient/library/howToFillIt';
import { useLibraryFilters } from '@ValenceClient/library/useLibraryFilters';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { APosterGrid } from '@ValenceMobile/components/APosterGrid/APosterGrid';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { TheSearchBox } from '@ValenceMobile/components/TheSearch/components/TheSearchBox/TheSearchBox';
import { TheBell } from '@ValenceMobile/components/TheBell/TheBell';
import { ACarriedMark } from '@ValenceMobile/components/ACarriedMark/ACarriedMark';
import { TheFilters } from '@ValenceMobile/components/TheLibrary/components/TheFilters/TheFilters';
import { TheHome } from '@ValenceMobile/components/TheLibrary/components/TheHome/TheHome';
import { TheBooks } from '@ValenceMobile/components/TheLibrary/components/TheBooks/TheBooks';
import { TheMusic } from '@ValenceMobile/components/TheLibrary/components/TheMusic/TheMusic';
import { TheClipBehind } from '@ValenceMobile/components/TheLibrary/components/TheClipBehind/TheClipBehind';
import { useArtworkLights } from '@ValenceMobile/hooks/useArtworkLights';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { AnArrival } from '@ValenceMobile/components/AnArrival/AnArrival';
import { ARRIVING } from '@ValenceMobile/components/AnArrival/ARRIVING';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { useIsOnTop } from '@ValenceMobile/hooks/useIsOnTop';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ABlur } from '@ValenceMobile/components/ABlur/ABlur';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { useTheSideStrip } from '@ValenceMobile/hooks/useTheSideStrip';
import { theColours } from '@ValenceMobile/theme/theColours';
import { theVeilFor } from '@ValenceMobile/components/TheLibrary/theVeilFor';
import { ACCOUNT_PANELS } from '@ValenceMobile/components/TheAccount/ACCOUNT_PANELS';
import { useAccountPanels } from '@ValenceMobile/components/TheAccount/useAccountPanels';
import { usePluginThemeInStep } from '@ValenceMobile/plugins/usePluginThemeInStep';
import { librariesChosen } from '@ValenceClient/library/librariesChosen';
import { libraryOptionsFor } from '@ValenceClient/library/libraryOptionsFor';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import type { ReactNode } from 'react';
import type { VideoPlayer } from 'expo-video';
import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';
import type { TheLibraryProps } from './TheLibrary.types';
import { say } from '@ValenceI18n/say';

const EVERY = 'every';

const NO_LIGHTS: ALight[] = [];

const BAR_TALL = 50;

const UNDER_THE_BAR = 10;

const ARRIVES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: true } as const;

const NO_LIBRARIES: readonly Library[] = [];

const SEARCH = 'search';

const SIDES = ['home', 'search', 'downloads', 'account'] as const;

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
 * What a poster on the grid is known by.
 *
 * @param media - The film, or the episode standing for its programme.
 * @returns Its key.
 */
const keyOfCell = (media: MediaSummary): string => media.id;

const BAR_MOVES_OVER = 260;

const BAR_TURNS_AFTER = 10;

const BAR_LIFTS_BY = 24;

const PARTS_BELOW_BY = 12;

const styles = StyleSheet.create({
  brand: { alignItems: 'center', flexDirection: 'row', gap: 10 },
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
 * Films and programmes each take the web's filters and order, the order remembered for each on this
 * phone, and where there is more than one library of a kind, a choice of which, and music is offered
 * as the web offers it, from its albums, artists and playlists, and books as the web offers them,
 * what somebody is part way through first.
 *
 * Programmes are read as their episodes gathered into programmes, as the web reads them, since genre
 * and year belong to the episodes and a programme is ordered by when its newest one arrived.
 *
 * @param onWatch - Told to play something, and from where.
 * @param onLookAt - Told which title somebody wants to see more of.
 * @param onLookAtShow - Told which programme, in which library.
 * @param onNotifications - Told somebody wants to see what the server has told them.
 * @param onScan - Told somebody wants to scan a television's code to sign it in.
 * @param onCalendar - Told somebody wants to see what comes out when, where requesting is on.
 * @param onRequested - Told somebody wants to see what has been asked for, where they may ask.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist.
 * @param onCollection - Told to open a collection.
 * @param onLiked - Told to open the songs this profile has liked.
 * @param onAllAlbums - Told somebody wants every album.
 * @param onAllArtists - Told somebody wants every artist.
 * @param onBook - Told to open a book.
 * @param onRead - Told to carry on reading a book.
 * @param onListen - Told to carry on listening to a book.
 * @param side - Which of the pages beside the library shows — the library itself, Search, Downloads
 *   or Account — each sliding in beneath the same bar and over the same background.
 * @param searchPage - Draws Search beneath the bar.
 * @param downloadsPage - Draws Downloads beneath the bar.
 * @param accountPage - Draws Account beneath the bar.
 */
const TheLibrary = ({
  onWatch,
  onLookAt,
  onLookAtShow,
  onNotifications,
  onScan,
  onCalendar,
  onRequested,
  onAlbum,
  onArtist,
  onPlaylist,
  onCollection,
  onLiked,
  onAllAlbums,
  onAllArtists,
  onBook,
  onRead,
  onListen,
  side = 'home',
  searchPage,
  downloadsPage,
  accountPage,
}: TheLibraryProps) => {
  const colours = useTheColours();
  const told = useRef({ onWatch, onLookAt, onLookAtShow, onCollection });
  const libraries = useQuery(libraryQueries.all());
  const faces = useQuery(linkingQueries.faces());
  const watched = useQuery(viewingQueries.progress());
  const filters = useLibraryFilters();
  const [part, setPart] = useState('home');
  const [barTall, setBarTall] = useState(BAR_TALL);
  const [barAway] = useState(() => new Animated.Value(0));
  const [isBarAway, setIsBarAway] = useState(false);
  const [partsTall, setPartsTall] = useState(0);
  const [searchingFor, setSearchingFor] = useState('');
  const [downloadsFor, setDownloadsFor] = useState('');
  const [accountShows, setAccountShows] = useState<string>(ACCOUNT_PANELS[0].id);
  const accountPanels = useAccountPanels();

  usePluginThemeInStep();
  const isSearching = side === 'search';
  const isAside = side !== 'home';
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set([side]));
  const { width: wide } = useWindowDimensions();

  useEffect(() => {
    setSeen((was) => (was.has(side) ? was : new Set([...was, side])));
  }, [side]);
  const [along] = useState(() => new Animated.Value(SIDES.indexOf(side)));

  useEffect(() => {
    setIsBarAway(false);
    Animated.timing(along, {
      toValue: SIDES.indexOf(side),
      duration: BAR_MOVES_OVER,
      easing: EASINGS.inOutCubic,
      useNativeDriver: true,
    }).start();
  }, [side, along]);
  const turnedAt = useRef(0);
  const isAway = isBarAway && !isAside;
  const aside = useRef(isAside);

  useLayoutEffect(() => {
    aside.current = isAside;
  }, [isAside]);

  useEffect(() => {
    Animated.timing(barAway, {
      toValue: isAway ? 1 : 0,
      duration: BAR_MOVES_OVER,
      easing: EASINGS.outCubic,
      useNativeDriver: true,
    }).start();
  }, [isAway, barAway]);

  const followScroll = useCallback(
    (y: number) => {
      if (aside.current) {
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
  const isPast = scrolled[isAside ? side : part] === true;
  const room = useSafeAreaInsets();
  const strip = useTheSideStrip();
  const [arriving] = useState(() => new Animated.Value(0));
  const isOnTop = useIsOnTop();

  useLayoutEffect(() => {
    told.current = { onWatch, onLookAt, onLookAtShow, onCollection };
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
  const lookAtCollection = useCallback((collectionId: string) => {
    told.current.onCollection(collectionId);
  }, []);
  const [chosen, setChosen] = useState(EVERY);
  const [arrangements, setArrangements] = useState<Readonly<Record<string, Arrangement>>>({});
  const arrangement = arrangements[part] ?? readBrowseArrangement(part);
  const arrange = useCallback(
    (next: Arrangement) => {
      setArrangements((was) => ({ ...was, [part]: next }));
      saveBrowseArrangement(part, next);
    },
    [part],
  );
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
  const reading = librariesChosen(ofThisKind, chosen === EVERY ? null : chosen).map(
    (library) => library.id,
  );
  const isFiltered = filters.selected.size > 0;
  const parts = [
    { id: 'home', label: say('common.home'), icon: HomeFilled },
    ...(films.length > 0 ? [{ id: 'films', label: say('common.films'), icon: FilmFilled }] : []),
    ...(programmes.length > 0
      ? [{ id: 'shows', label: say('common.shows'), icon: MonitorFilled }]
      : []),
    ...(hasMusic ? [{ id: 'music', label: say('common.music'), icon: MusicNoteFilled }] : []),
    ...(bookLibraries.length > 0
      ? [{ id: 'books', label: say('common.books'), icon: BookOpenFilled }]
      : []),
  ];

  const everything = useQuery({
    ...libraryQueries.everything(reading, {
      kind: part === 'shows' ? 'shows' : 'films',
      ...filters.asked,
    }),
    enabled: reading.length > 0 && (part === 'films' || part === 'shows'),
  });
  const isFinished = useCallback(
    (mediaId: string) => howFar.get(mediaId)?.isFinished === true,
    [howFar],
  );
  const cells = useMemo(
    (): readonly MediaSummary[] =>
      part === 'films' || part === 'shows'
        ? arrangeForBrowsing(everything.data ?? [], { ...arrangement, isFinished })
        : [],
    [part, everything.data, arrangement, isFinished],
  );
  const left = useMemo(
    () => (part === 'shows' ? unwatchedByShow(everything.data ?? [], isFinished) : null),
    [part, everything.data, isFinished],
  );
  const hasAnything = (everything.data ?? []).length > 0;
  const isWaiting = everything.isPending && everything.fetchStatus !== 'idle';

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
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: theVeilFor(colours) }]}
        pointerEvents="none"
      />
      <ARRIVING.Provider value={arriving}>{drawn}</ARRIVING.Provider>
      {bar}
    </View>
  );

  const bar = (
    <View
      style={[
        styles.fixed,
        {
          paddingLeft: strip?.side === 'left' ? strip.breadth : 0,
          paddingRight: strip?.side === 'right' ? strip.breadth : 0,
          paddingTop: room.top + SCREEN_EDGE,
        },
      ]}
      pointerEvents="box-none"
    >
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
          <View style={styles.brand}>
            <ACarriedMark isHandedOn={false} />
            <Words size="heading">{say('common.valence')}</Words>
          </View>
          <View style={styles.aside}>
            {onRequested === undefined ? null : (
              <AGlassCircle of={Inbox} label={say('common.requested')} onPress={onRequested} />
            )}
            {onCalendar === undefined ? null : (
              <AGlassCircle of={Calendar} label={say('common.calendar')} onPress={onCalendar} />
            )}
            <AGlassCircle
              of={ScanQrCode}
              label={say('common.signInATelevision')}
              onPress={onScan}
            />
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
          <View pointerEvents={isAside ? 'none' : 'auto'}>
            <SegmentedRow
              label={say('common.whatToShow')}
              fills
              isShown={!isAside && !isBarAway}
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
              placeholder={say('common.filmsProgrammesPeople')}
              onSettle={setSearchingFor}
              isCapsule
              isShown={isSearching}
            />
          </View>
          <View pointerEvents={side === 'downloads' ? 'auto' : 'none'} style={styles.searchInstead}>
            <TheSearchBox
              placeholder={say('phone.theLibrary.findADownload')}
              onSettle={setDownloadsFor}
              isCapsule
              isShown={side === 'downloads'}
            />
          </View>
          <View pointerEvents={side === 'account' ? 'auto' : 'none'} style={styles.searchInstead}>
            <SegmentedRow
              label={say('common.whatToChange')}
              fills
              isShown={side === 'account'}
              items={accountPanels}
              value={accountShows}
              onSelect={setAccountShows}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );

  const searchScrolled = useCallback((isScrolled: boolean) => {
    setScrolled((was) => noteScrolled(was, SEARCH, isScrolled));
  }, []);

  const downloadsScrolled = useCallback((isScrolled: boolean) => {
    setScrolled((was) => noteScrolled(was, 'downloads', isScrolled));
  }, []);

  const accountScrolled = useCallback((isScrolled: boolean) => {
    setScrolled((was) => noteScrolled(was, 'account', isScrolled));
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
            {libraries.isError ? (
              <Words tone="danger">{say('common.thoseCouldNotBeRead')}</Words>
            ) : null}

            {ofThisKind.length > 1 ? (
              <SegmentedRow
                label={say('common.whichLibrary')}
                items={libraryOptionsFor(ofThisKind, faces.data ?? [], EVERY, say('common.all'))}
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
                arrangement={arrangement}
                onArrange={arrange}
              />
            )}

            {isWaiting ? <ActivityIndicator color={colours.textMuted} /> : null}

            {!drawsItsOwn && !isWaiting && cells.length === 0 ? (
              hasAnything ? (
                <ANothingHere
                  of={part === 'films' ? Film : Monitor}
                  title={say('common.youHaveWatchedEverythingHere')}
                />
              ) : isFiltered ? (
                <ANothingHere
                  of={SearchX}
                  title={say('common.nothingMatchesThose')}
                  detail={say('phone.theLibrary.tryFewerFiltersOrClearThem')}
                />
              ) : (
                <ANothingHere
                  of={part === 'films' ? Film : Monitor}
                  title={part === 'films' ? say('common.noFilmsYet') : say('common.noShowsYet')}
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
      faces.data,
      chosen,
      filters.groups,
      filters.selected,
      filters.change,
      filters.clear,
      colours.textMuted,
      cells.length,
      hasAnything,
      isFiltered,
      part,
      arrangement,
      arrange,
    ],
  );

  const drawn = useCallback(
    (media: MediaSummary, wide: number) => {
      const known = howFar.get(media.id);

      return (
        <ACard
          media={media}
          asProgramme={part === 'shows'}
          watched={known === undefined ? 0 : watchedFraction(known)}
          count={left?.get(media.seriesId ?? media.seriesTitle ?? '') ?? 0}
          wide={wide}
          onLookAt={lookAt}
          onLookAtShow={lookAtShow}
        />
      );
    },
    [howFar, part, left, lookAt, lookAtShow],
  );

  const slides = useMemo(() => {
    const at = (which: (typeof SIDES)[number]) =>
      along.interpolate({
        inputRange: [0, SIDES.length - 1],
        outputRange: [
          SIDES.indexOf(which) * wide,
          (SIDES.indexOf(which) - (SIDES.length - 1)) * wide,
        ],
      });

    return {
      home: at('home'),
      search: at('search'),
      downloads: at('downloads'),
      account: at('account'),
    };
  }, [along, wide]);
  const underTheBar = useMemo(
    () => <View style={{ height: barTall - UNDER_THE_BAR }} />,
    [barTall],
  );
  const searchShown = useMemo(
    () => searchPage?.(underTheBar, searchingFor, searchScrolled),
    [searchPage, underTheBar, searchingFor, searchScrolled],
  );
  const downloadsShown = useMemo(
    () => downloadsPage?.(underTheBar, downloadsScrolled, downloadsFor),
    [downloadsPage, underTheBar, downloadsScrolled, downloadsFor],
  );
  const accountShown = useMemo(
    () => accountPage?.(underTheBar, accountScrolled, accountShows, setAccountShows),
    [accountPage, underTheBar, accountScrolled, accountShows],
  );
  const sidePages = [
    ['search', searchShown],
    ['downloads', downloadsShown],
    ['account', accountShown],
  ] as const;

  const isHomeSeen = part === 'home';

  const home = (
    <View
      collapsable={false}
      style={[StyleSheet.absoluteFill, isHomeSeen ? null : styles.hidden]}
      pointerEvents={isHomeSeen ? 'auto' : 'none'}
      accessibilityElementsHidden={!isHomeSeen || isAside}
      importantForAccessibility={isHomeSeen && !isAside ? 'auto' : 'no-hide-descendants'}
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
          onLookAtCollection={lookAtCollection}
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
        pointerEvents={isAside ? 'none' : 'box-none'}
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: slides.home }] }]}
      >
        {home}
        {part === 'home' ? null : part === 'books' ? (
          <TheBooks
            header={header}
            libraryIds={bookLibraries}
            onBook={onBook}
            onRead={onRead}
            onListen={onListen}
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

      {sidePages.map(([which, page]) =>
        !seen.has(which) || page === undefined ? null : (
          <Animated.View
            key={which}
            collapsable={false}
            pointerEvents={side === which ? 'box-none' : 'none'}
            accessibilityElementsHidden={side !== which}
            importantForAccessibility={side === which ? 'auto' : 'no-hide-descendants'}
            style={[StyleSheet.absoluteFill, { transform: [{ translateX: slides[which] }] }]}
          >
            <IS_ON_TOP.Provider value={isOnTop && side === which}>{page}</IS_ON_TOP.Provider>
          </Animated.View>
        ),
      )}
    </>,
  );
};

TheLibrary.displayName = 'TheLibrary';

export { TheLibrary };
