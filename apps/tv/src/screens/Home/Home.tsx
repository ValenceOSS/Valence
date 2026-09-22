import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { useHomeRows } from '@ValenceClient/library/useHomeRows';
import { pickFeatured } from '@ValenceClient/library/pickFeatured';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { Hero } from '@ValenceTv/components/Hero/Hero';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import { useProgress } from '@ValenceTv/library/useProgress';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HomeProps } from './Home.types';

const HERO_SAMPLE = 40;

const HERO_TURNS = 5;

const RESUMING = 'resume';

/**
 * The front page: a handful of titles taking turns across the whole screen, and beneath them the same shelves the web's front page
 * has — what this viewer is part-way through, what is new, what is well thought of, then a shelf
 * for every genre — asked for a few at a time as the remote moves down towards them.
 *
 * @param viewerId - Whose front page it is.
 * @param watchable - The libraries holding something to watch.
 * @param onOpen - Told to open a title's page.
 * @param onPlay - Told to play a title, and from where.
 * @param isCovered - Whether another page is over the front page, which stops its preview.
 * @param onFeature - Told which title the top of the page is showing.
 */
const Home = ({ viewerId, watchable, onOpen, onPlay, isCovered, onFeature }: HomeProps) => {
  const { progress, isKnown } = useProgress();
  const home = useHomeRows(viewerId, watchable, progress, true, isKnown);

  const sample = useQuery({
    ...libraryQueries.across(watchable, { search: '', limit: HERO_SAMPLE }),
    enabled: watchable.length > 0,
  });

  const room = useRoomToFill();

  const featured = useMemo(() => pickFeatured(sample.data ?? [], HERO_TURNS), [sample.data]);

  if (home.isReading && home.rails.length === 0) {
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
        <FlatList
          data={home.rails}
          keyExtractor={(rail) => rail.id}
          style={{ height: room.height }}
          contentContainerStyle={styles.inside}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            featured.length === 0 ? null : (
              <Hero
                items={featured}
                progress={progress}
                isCovered={isCovered}
                onPlay={onPlay}
                onInspect={onOpen}
                onFeature={onFeature}
              />
            )
          }
          ListFooterComponent={
            home.isReadingMore ? (
              <ActivityIndicator style={styles.more} color={tokens.colours.muted} />
            ) : null
          }
          onEndReachedThreshold={1.5}
          onEndReached={() => {
            if (home.hasMore && !home.isReadingMore) {
              home.showMore();
            }
          }}
          renderItem={({ item }) => (
            <Shelf
              title={item.title}
              items={item.items}
              progress={progress}
              areEpisodes={item.id === RESUMING}
              onOpen={(media) => {
                if (item.id === RESUMING) {
                  onPlay(media, resumeFor(progress, media.id) ?? 0);

                  return;
                }

                onOpen(media);
              }}
            />
          )}
        />
      )}
    </View>
  );
};

Home.displayName = 'Home';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: { gap: tokens.space.md, paddingBottom: tokens.space.xl },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
  more: { marginVertical: tokens.space.lg },
});

export { Home };
