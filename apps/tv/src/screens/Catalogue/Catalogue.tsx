import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import { useProgress } from '@ValenceTv/library/useProgress';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CatalogueProps } from './Catalogue.types';

const ACROSS = 6;

const TITLES = { films: 'Films', shows: 'Shows' } as const;

/**
 * Every film, or every programme, as a wall of posters in alphabetical order, as the web's Films and
 * Shows pages have them.
 *
 * A programme is one poster however many episodes it has, and a film somebody is part-way through
 * says how far.
 *
 * @param kind - Films or shows.
 * @param watchable - The libraries holding something to watch.
 * @param onOpen - Told which title was chosen.
 */
const Catalogue = ({ kind, watchable, onOpen }: CatalogueProps) => {
  const { progress } = useProgress();
  const everything = useQuery({
    ...libraryQueries.everything(watchable, { kind, order: 'title' }),
    enabled: watchable.length > 0,
  });

  const room = useRoomToFill();

  const items = useMemo(
    () => (kind === 'shows' ? collapseToShows(everything.data ?? []) : (everything.data ?? [])),
    [everything.data, kind],
  );

  if (everything.isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>
          {kind === 'films' ? 'There are no films here yet.' : 'There are no shows here yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.page} onLayout={room.onLayout}>
      {room.height === null ? null : (
        <FlatList
          data={items}
          numColumns={ACROSS}
          keyExtractor={(media) => media.id}
          style={{ height: room.height }}
          contentContainerStyle={styles.inside}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.title}>{TITLES[kind]}</Text>}
          renderItem={({ item }) => {
            const watched = progress.get(item.id);

            return (
              <MediaCard
                media={item}
                shape="poster"
                onPress={onOpen}
                {...(watched === undefined || kind === 'shows'
                  ? {}
                  : { watchedFraction: watchedFraction(watched) })}
              />
            );
          }}
        />
      )}
    </View>
  );
};

Catalogue.displayName = 'Catalogue';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.xl,
    gap: tokens.space.lg,
  },
  row: { gap: tokens.space.md },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.title,
    fontWeight: '700',
    marginBottom: tokens.space.sm,
  },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { Catalogue };
