import { Film, FolderOpen } from '@keyline-icons/react-native';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { howToFillIt } from '@ValenceClient/library/howToFillIt';
import { pickFeatured } from '@ValenceClient/library/pickFeatured';
import { useHomeRows } from '@ValenceClient/library/useHomeRows';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { AnArrival } from '@ValencePhone/components/AnArrival/AnArrival';
import { ANothingHere } from '@ValencePhone/components/ANothingHere/ANothingHere';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { Button } from '@ValencePhone/components/Button/Button';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { ACard } from '@ValencePhone/components/ACard/ACard';
import { TheFeatured } from '@ValencePhone/components/TheLibrary/components/TheFeatured/TheFeatured';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { usePullToRefresh } from '@ValencePhone/hooks/usePullToRefresh';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { Rail } from '@ValenceClient/library/groupIntoRails';
import type { TheHomeProps } from './TheHome.types';

const FEATURED = 5;

const FEATURED_FROM = 200;

const RESUMING = 'resume';

const SCROLLED = 4;

const styles = StyleSheet.create({
  header: { gap: 20 },
  whole: { flex: 1 },
});

type AShelfOf = { kind: 'rail'; rail: Rail } | { kind: 'comingUp' };

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
 */
const TheHome = ({
  header,
  watchable,
  librariesAre,
  onWatch,
  onLookAt,
  onLookAtShow,
  onShowing,
  onClip,
  onScrolled,
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
  const upcoming = comingUp.data ?? [];

  const shelves: AShelfOf[] = home.rails.flatMap((rail): AShelfOf[] =>
    rail.id === RESUMING && upcoming.length > 0
      ? [{ kind: 'rail', rail }, { kind: 'comingUp' }]
      : [{ kind: 'rail', rail }],
  );
  const withComingUp =
    upcoming.length > 0 && !home.rails.some((rail) => rail.id === RESUMING)
      ? [{ kind: 'comingUp' } satisfies AShelfOf, ...shelves]
      : shelves;
  const isEmpty =
    librariesAre !== 'reading' &&
    !home.isReading &&
    (watchable.length === 0 || !sample.isPending) &&
    withComingUp.length === 0 &&
    featured.length === 0;

  /**
   * Draws one shelf of the home page.
   *
   * @param shelf - Which shelf.
   * @returns It.
   */
  const drawShelf = (shelf: AShelfOf) =>
    shelf.kind === 'comingUp' ? (
      <AShelf title="Coming up">
        {upcoming.map(({ show, episode }) => (
          <Button
            key={show.id}
            tone="bare"
            label={show.title}
            onPress={() => {
              onLookAtShow(show.libraryId, show.id);
            }}
          >
            <APoster
              title={show.title}
              artwork={onThisServer(`/api/media/${show.coverMediaId}/image/poster`)}
              note={`S${episode.seasonNumber.toString()} E${episode.episodeNumber.toString()} · ${describeAirDate(episode.airDate, today)}`}
            />
          </Button>
        ))}
      </AShelf>
    ) : (
      <AShelf title={shelf.rail.title}>
        {shelf.rail.items.map((media) => {
          const known = progress.get(media.id);

          return (
            <ACard
              key={media.id}
              media={media}
              asProgramme={shelf.rail.id !== RESUMING}
              watched={known === undefined ? 0 : watchedFraction(known)}
              onLookAt={onLookAt}
              onLookAtShow={onLookAtShow}
            />
          );
        })}
      </AShelf>
    );

  return (
    <FlatList
      data={withComingUp}
      scrollEventThrottle={16}
      onScroll={({ nativeEvent }) => {
        onScrolled?.(nativeEvent.contentOffset.y > SCROLLED);
      }}
      keyExtractor={(shelf) => (shelf.kind === 'rail' ? shelf.rail.id : 'coming-up')}
      renderItem={({ item: shelf }) => <AnArrival>{drawShelf(shelf)}</AnArrival>}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          <AnArrival>
            <TheFeatured
              items={featured}
              onShowing={onShowing}
              onClip={onClip}
              onWatch={onWatch}
              onLookAt={onLookAt}
              onLookAtShow={onLookAtShow}
            />
          </AnArrival>
          {home.isReading ? <ActivityIndicator color={colours.textMuted} /> : null}
        </View>
      }
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
      ListFooterComponent={
        home.isReadingMore ? <ActivityIndicator color={colours.textMuted} /> : null
      }
      onEndReached={() => {
        if (home.hasMore && !home.isReadingMore) {
          home.showMore();
        }
      }}
      onEndReachedThreshold={1.5}
      contentContainerStyle={{
        gap: 26,
        paddingBottom: room.bottom + SCREEN_EDGE,
        paddingHorizontal: SCREEN_EDGE,
        paddingTop: room.top + SCREEN_EDGE,
      }}
      style={styles.whole}
      keyboardShouldPersistTaps="handled"
      refreshControl={pulling}
    />
  );
};

TheHome.displayName = 'TheHome';

export { TheHome };
