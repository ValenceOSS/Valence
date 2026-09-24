import { Film, FolderOpen } from '@keyline-icons/react-native';
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { howToFillIt } from '@ValenceClient/library/howToFillIt';
import { pickFeatured } from '@ValenceClient/library/pickFeatured';
import { useHomeRows } from '@ValenceClient/library/useHomeRows';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { AnArrival } from '@ValencePhone/components/AnArrival/AnArrival';
import { ANothingHere } from '@ValencePhone/components/ANothingHere/ANothingHere';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { THE_FIRST_SCREEN_IS_READY } from '@ValencePhone/components/ASplash/THE_FIRST_SCREEN_IS_READY';
import { TheFeatured } from '@ValencePhone/components/TheLibrary/components/TheFeatured/TheFeatured';
import { AHomeShelf } from '@ValencePhone/components/TheLibrary/components/TheHome/components/AHomeShelf/AHomeShelf';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { ComingUp } from '@ValenceContracts/schemas/Show';
import type { AShelfOf } from '@ValencePhone/components/TheLibrary/components/TheHome/components/AHomeShelf/AHomeShelf.types';
import type { TheHomeProps } from './TheHome.types';

const FEATURED = 5;

const FEATURED_FROM = 200;

const RESUMING = 'resume';

const SCROLLED = 4;

const STILL_SEEN_BY = 96;

const NOTHING_COMING: ComingUp['shows'] = [];

const styles = StyleSheet.create({
  header: { gap: 20 },
  whole: { flex: 1 },
});

/**
 * What a shelf is known by in the list.
 *
 * @param shelf - The shelf.
 * @returns Its key.
 */
const keyOfShelf = (shelf: AShelfOf): string =>
  shelf.kind === 'rail' ? shelf.rail.id : 'coming-up';

/**
 * The library's front page, as the web's: a few things featured, then shelves — what somebody is
 * part way through, what is coming up, what was picked for them, what is new and acclaimed, and a
 * shelf for each genre and decade, more of them arriving as they scroll.
 *
 * Only the shelves in view are drawn, so the ones that keep arriving cost nothing until reached.
 *
 * @param header - What sits above it all and scrolls away with it.
 * @param watchable - The libraries holding films and programmes.
 * @param librariesAre - Whether the libraries are still being read, the server has none at all, or
 *   it has some — nothing is called empty until they are read, and none at all is said differently
 *   from libraries with nothing in them yet.
 * @param onWatch - Told to play something, and from where.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 * @param onShowing - Told which title the hero is showing, so the page can take its colours.
 * @param onClip - Told the hero's clip while it plays.
 * @param onScrolled - Told whether the page has been scrolled from its top.
 * @param isOnScreen - Whether home is the part showing, rather than kept hidden behind another.
 */
const TheHomePage = ({
  header,
  watchable,
  librariesAre,
  onWatch,
  onLookAt,
  onLookAtShow,
  onShowing,
  onClip,
  onScrolled,
  isOnScreen = true,
}: TheHomeProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const pulling = usePullToRefresh();
  const who = useQuery(sessionQueries.who());
  const watched = useQuery(viewingQueries.progress());
  const progress = useMemo(() => byMediaId(watched.data ?? []), [watched.data]);
  const viewer = who.data?.id ?? null;
  const home = useHomeRows(viewer ?? '', watchable, progress, viewer !== null, !watched.isPending);
  const sample = useQuery(libraryQueries.across(watchable, { search: '', limit: FEATURED_FROM }));
  const featured = useMemo(() => pickFeatured(sample.data ?? [], FEATURED), [sample.data]);
  const comingUp = useQuery(libraryQueries.comingUp());
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = comingUp.data ?? NOTHING_COMING;
  const sayReady = useContext(THE_FIRST_SCREEN_IS_READY);
  const wasScrolled = useRef<boolean | null>(null);
  const heroEnds = useRef<number | null>(null);
  const [isHeroInView, setIsHeroInView] = useState(true);

  const withComingUp = useMemo(() => {
    const shelves = home.rails.flatMap((rail): AShelfOf[] =>
      rail.id === RESUMING && upcoming.length > 0
        ? [{ kind: 'rail', rail }, { kind: 'comingUp' }]
        : [{ kind: 'rail', rail }],
    );

    return upcoming.length > 0 && !home.rails.some((rail) => rail.id === RESUMING)
      ? [{ kind: 'comingUp' } satisfies AShelfOf, ...shelves]
      : shelves;
  }, [home.rails, upcoming]);
  const isEmpty =
    librariesAre !== 'reading' &&
    !home.isReading &&
    (watchable.length === 0 || !sample.isPending) &&
    withComingUp.length === 0 &&
    featured.length === 0;

  const renderShelf = useCallback(
    ({ item: shelf }: { item: AShelfOf }) => (
      <AnArrival>
        <AHomeShelf
          shelf={shelf}
          upcoming={upcoming}
          progress={progress}
          today={today}
          onLookAt={onLookAt}
          onLookAtShow={onLookAtShow}
        />
      </AnArrival>
    ),
    [upcoming, progress, today, onLookAt, onLookAtShow],
  );

  const onScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const isScrolled = nativeEvent.contentOffset.y > SCROLLED;
      const isHeroSeen =
        heroEnds.current === null || nativeEvent.contentOffset.y < heroEnds.current - STILL_SEEN_BY;

      setIsHeroInView(isHeroSeen);

      if (isScrolled !== wasScrolled.current) {
        wasScrolled.current = isScrolled;
        onScrolled?.(isScrolled);
      }
    },
    [onScrolled],
  );

  useEffect(() => {
    if (!home.isReading) {
      sayReady();
    }
  }, [home.isReading, sayReady]);

  const { hasMore, isReadingMore, showMore } = home;
  const onEndReached = useCallback(() => {
    if (hasMore && !isReadingMore) {
      showMore();
    }
  }, [hasMore, isReadingMore, showMore]);

  const head = useMemo(
    () => (
      <View style={styles.header}>
        {header}
        <View
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;

            heroEnds.current = y + height;
          }}
        >
          <AnArrival>
            <TheFeatured
              items={featured}
              isInView={isHeroInView && isOnScreen}
              onShowing={onShowing}
              onClip={onClip}
              onWatch={onWatch}
              onLookAt={onLookAt}
              onLookAtShow={onLookAtShow}
            />
          </AnArrival>
        </View>
        {home.isReading ? <ActivityIndicator color={colours.textMuted} /> : null}
      </View>
    ),
    [
      header,
      featured,
      onShowing,
      onClip,
      onWatch,
      onLookAt,
      onLookAtShow,
      home.isReading,
      colours.textMuted,
      isHeroInView,
      isOnScreen,
    ],
  );

  const spacing = useMemo(
    () => ({
      gap: 26,
      paddingBottom: room.bottom + SCREEN_EDGE,
      paddingHorizontal: SCREEN_EDGE,
      paddingTop: room.top + SCREEN_EDGE,
    }),
    [room.bottom, room.top],
  );

  return (
    <FlatList
      data={withComingUp}
      scrollEventThrottle={16}
      onScroll={onScroll}
      keyExtractor={keyOfShelf}
      renderItem={renderShelf}
      initialNumToRender={3}
      maxToRenderPerBatch={2}
      windowSize={5}
      ListHeaderComponent={head}
      ListEmptyComponent={
        isEmpty ? (
          librariesAre === 'missing' ? (
            <ANothingHere
              of={FolderOpen}
              title="No libraries yet"
              detail={howToFillIt('no libraries', false)}
            />
          ) : (
            <ANothingHere
              of={Film}
              title="Nothing to watch yet"
              detail={howToFillIt('every library', false)}
            />
          )
        ) : null
      }
      ListFooterComponent={isReadingMore ? <ActivityIndicator color={colours.textMuted} /> : null}
      onEndReached={onEndReached}
      onEndReachedThreshold={1.5}
      contentContainerStyle={spacing}
      style={styles.whole}
      keyboardShouldPersistTaps="handled"
      refreshControl={pulling}
    />
  );
};

const TheHome = memo(TheHomePage);

TheHome.displayName = 'TheHome';

export { TheHome };
