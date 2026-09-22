import { FlatList, StyleSheet, Text, View } from 'react-native';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ShelfProps } from './Shelf.types';

/**
 * A named row of titles for the remote to move along, the television's rail.
 *
 * Each card carries how far through it this viewer is, so a shelf of things somebody started says
 * so at a glance.
 *
 * @param title - What the row is.
 * @param items - What is on it.
 * @param progress - How far through each thing this viewer is.
 * @param onOpen - Told which title was chosen.
 * @param shape - Wide cards or posters.
 * @param areEpisodes - Whether the cards stand for episodes rather than their programmes.
 * @param onFocus - Told which title the remote is on.
 */
const Shelf = ({
  title,
  items,
  progress,
  onOpen,
  shape = 'wide',
  areEpisodes = false,
  onFocus,
}: ShelfProps) => (
  <View style={styles.shelf}>
    <Text style={styles.title}>{title}</Text>

    <FlatList
      horizontal
      data={items}
      keyExtractor={(media) => media.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.inside}
      style={styles.row}
      renderItem={({ item }) => {
        const watched = progress.get(item.id);

        return (
          <MediaCard
            media={item}
            shape={shape}
            isEpisode={areEpisodes}
            onPress={onOpen}
            {...(watched === undefined ? {} : { watchedFraction: watchedFraction(watched) })}
            {...(onFocus === undefined ? {} : { onFocus })}
          />
        );
      }}
    />
  </View>
);

Shelf.displayName = 'Shelf';

const styles = StyleSheet.create({
  shelf: { gap: tokens.space.xs },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  row: { overflow: 'visible' },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.md,
    gap: tokens.space.md,
  },
});

export { Shelf };
