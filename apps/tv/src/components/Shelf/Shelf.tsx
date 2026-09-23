import { memo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from 'react-native';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import { cardSizes } from '@ValenceTv/components/MediaCard/cardSizes';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ShelfProps } from './Shelf.types';

/**
 * Whether a shelf would be drawn the same: the same titles in the same order, and everything else it
 * is handed unchanged. The titles are compared one by one because the front page puts each row
 * together again whenever it is drawn, so an unchanged row still arrives as a new list.
 *
 * @param was - What the shelf was handed last time.
 * @param now - What it is handed now.
 * @returns Whether drawing it again can be skipped.
 */
const isSameShelf = (was: ShelfProps, now: ShelfProps): boolean =>
  was.title === now.title &&
  was.progress === now.progress &&
  was.onOpen === now.onOpen &&
  was.onFocus === now.onFocus &&
  was.shape === now.shape &&
  was.areEpisodes === now.areEpisodes &&
  was.isUrgent === now.isUrgent &&
  was.items.length === now.items.length &&
  was.items.every((media, at) => media === now.items[at] || media.id === now.items[at]?.id);

/**
 * A named row of titles for the remote to move along, the television's rail.
 *
 * Each card carries how far through it this viewer is, so a shelf of things somebody started says
 * so at a glance. The row catches the remote across the whole width of the screen, so moving up or
 * down onto a shelf with only a few titles at its left lands on it from anywhere, not only from what
 * sits straight above or below.
 *
 * It is drawn again only when its titles or what it is handed change, so moving about the rest of
 * the page does not draw every card on it again. It builds only the cards that fit across the screen
 * and one more, and keeps a screen's worth either side of the remote, so a long shelf costs no more
 * than a short one.
 *
 * @param title - What the row is.
 * @param items - What is on it.
 * @param progress - How far through each thing this viewer is.
 * @param onOpen - Told which title was chosen.
 * @param shape - Wide cards or posters.
 * @param areEpisodes - Whether the cards stand for episodes rather than their programmes.
 * @param isUrgent - Whether its pictures are fetched ahead of the others', as the first shelf's are.
 * @param onFocus - Told which title the remote is on.
 */
const ShelfRow = ({
  title,
  items,
  progress,
  onOpen,
  shape = 'wide',
  areEpisodes = false,
  isUrgent = false,
  onFocus,
}: ShelfProps) => {
  const screen = useWindowDimensions();
  const card = cardSizes[shape];
  const inView = Math.ceil(screen.width / (card.width + tokens.space.md)) + 1;

  return (
    <View style={styles.shelf}>
      <Text style={styles.title}>{title}</Text>

      <TVFocusGuideView autoFocus>
        <FlatList
          horizontal
          initialNumToRender={inView}
          maxToRenderPerBatch={inView}
          windowSize={3}
          removeClippedSubviews={false}
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
                isUrgent={isUrgent}
                onPress={onOpen}
                {...(watched === undefined ? {} : { watchedFraction: watchedFraction(watched) })}
                {...(onFocus === undefined ? {} : { onFocus })}
              />
            );
          }}
        />
      </TVFocusGuideView>
    </View>
  );
};

const Shelf = memo(ShelfRow, isSameShelf);

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
