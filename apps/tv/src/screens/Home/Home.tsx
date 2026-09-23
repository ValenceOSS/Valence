import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { useHomeRows } from '@ValenceClient/library/useHomeRows';
import { pickFeatured } from '@ValenceClient/library/pickFeatured';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { Hero } from '@ValenceTv/components/Hero/Hero';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import { useProgress } from '@ValenceTv/library/useProgress';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { putOnTheTopShelf } from '@ValenceTv/platform/putOnTheTopShelf';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { HomeProps } from './Home.types';

const HERO_SAMPLE = 40;

const HERO_TURNS = 5;

const RESUMING = 'resume';

const ASKS_WITHIN_SCREENS = 1.5;

const HEARS_SCROLL_EVERY_MS = 250;

/**
 * The front page: a handful of titles taking turns across the whole screen, and beneath them the
 * same shelves the web's front page has — what this viewer is part-way through, what is new, what
 * is well thought of, then a shelf for every genre — asked for a few at a time as the remote moves
 * down towards them.
 *
 * Its shelf of what has just arrived is handed to the television too, for the row it shows above
 * Valence on the Home screen.
 *
 * Nothing is drawn until the titles for the top are known as well as the first shelves, so the
 * shelves are not drawn first and then pushed down the screen by the hero arriving above them.
 * Coming back up onto the hero's buttons scrolls the page back to the top, so the hero is seen whole
 * rather than half off the screen above.
 *
 * It is drawn again only when what it is handed changes, not whenever the screen around it is: it
 * stays mounted beneath the other parts, and every move along the bar would otherwise draw every
 * shelf and card on it again.
 *
 * The page is one scroll of shelves rather than a list that builds rows as they come near: the
 * television's lists hold the remote back until the next row is built, which a quick run down the
 * page outruns. Each shelf builds its own cards as the remote nears them instead. More shelves are
 * asked for once the end of the page is within a screen and a half.
 *
 * @param viewerId - Whose front page it is.
 * @param watchable - The libraries holding something to watch.
 * @param onOpen - Told to open a title's page.
 * @param onPlay - Told to play a title, and from where.
 * @param isCovered - Whether another page is over the front page, which stops its preview.
 * @param onFeature - Told which title the top of the page is showing.
 * @param upTo - The bar along the top, which pressing up from the top of the page goes to.
 * @param playRef - Handed the hero's Play button, which pressing down from the bar goes to.
 * @param isHeldBack - Whether to wait before drawing anything, while somebody's face is still
 *   flying into the bar as they sign in; what it needs is asked for all the same.
 */
const HomePage = ({
  viewerId,
  watchable,
  onOpen,
  onPlay,
  isCovered,
  onFeature,
  upTo,
  playRef,
  isHeldBack,
}: HomeProps) => {
  const { progress, isKnown } = useProgress();
  const home = useHomeRows(viewerId, watchable, progress, true, isKnown);

  const sample = useQuery({
    ...libraryQueries.across(watchable, { search: '', limit: HERO_SAMPLE }),
    enabled: watchable.length > 0,
  });

  const room = useRoomToFill();
  const list = useRef<ScrollView>(null);
  const isAsking = useRef(false);

  const showTheTop = useCallback(() => {
    list.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const resume = useCallback(
    (media: MediaSummary) => {
      onPlay(media, resumeFor(progress, media.id) ?? 0);
    },
    [onPlay, progress],
  );

  const { hasMore, isReadingMore, showMore } = home;

  const railCount = home.rails.length;

  useEffect(() => {
    isAsking.current = isReadingMore;
  }, [isReadingMore, railCount]);

  const askNearTheEnd = useCallback(
    (seen: number, tall: number, window: number) => {
      if (hasMore && !isAsking.current && tall - seen < window * (1 + ASKS_WITHIN_SCREENS)) {
        isAsking.current = true;
        showMore();
      }
    },
    [hasMore, showMore],
  );

  const heardScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      askNearTheEnd(contentOffset.y, contentSize.height, layoutMeasurement.height);
    },
    [askNearTheEnd],
  );

  const arrivals = home.rails.find((rail) => rail.id === 'recent')?.items;
  const shelved = useRef('');

  useEffect(() => {
    const ids = (arrivals ?? []).map((media) => media.id).join();

    if (arrivals !== undefined && arrivals.length > 0 && ids !== shelved.current) {
      shelved.current = ids;
      putOnTheTopShelf(arrivals);
    }
  });

  const featured = useMemo(() => pickFeatured(sample.data ?? [], HERO_TURNS), [sample.data]);

  if (isHeldBack) {
    return <View style={styles.page} />;
  }

  if ((home.isReading && home.rails.length === 0) || (sample.isPending && watchable.length > 0)) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (home.rails.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>There is nothing to watch here yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page} onLayout={room.onLayout}>
      {room.height === null ? null : (
        <ScrollView
          ref={list}
          style={{ height: room.height }}
          contentContainerStyle={styles.inside}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={HEARS_SCROLL_EVERY_MS}
          onScroll={heardScroll}
          onContentSizeChange={(_, tall) => {
            askNearTheEnd(0, tall, room.height ?? 0);
          }}
        >
          {featured.length === 0 ? null : (
            <Hero
              items={featured}
              progress={progress}
              isCovered={isCovered}
              onPlay={onPlay}
              onInspect={onOpen}
              onFeature={onFeature}
              upTo={upTo}
              onReached={showTheTop}
              playRef={playRef}
            />
          )}

          {home.rails.map((rail, at) => (
            <Shelf
              key={rail.id}
              title={rail.title}
              items={rail.items}
              progress={progress}
              areEpisodes={rail.id === RESUMING}
              isUrgent={at === 0}
              onOpen={rail.id === RESUMING ? resume : onOpen}
            />
          ))}

          {isReadingMore ? (
            <ActivityIndicator style={styles.more} color={tokens.colours.muted} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

const Home = memo(HomePage);

Home.displayName = 'Home';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: { gap: tokens.space.md, paddingBottom: tokens.space.xl },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
  more: { marginVertical: tokens.space.lg },
});

export { Home };
