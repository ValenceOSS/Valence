import { memo } from 'react';
import { FlatList, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { MusicTile } from '@ValenceTv/components/MusicTile/MusicTile';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MusicShelfProps } from './MusicShelf.types';

const IN_VIEW = 8;

/**
 * A named row of albums, artists or playlists for the remote to move along, which catches the
 * remote across the whole width of the screen as the television's other shelves do.
 *
 * @param title - What the row is.
 * @param items - What is on it.
 * @param onOpen - Told which was chosen.
 * @param onFocus - Told which the remote is on.
 */
const MusicShelfRow = ({ title, items, onOpen, onFocus }: MusicShelfProps) => (
  <View style={styles.shelf}>
    <Text style={styles.title}>{title}</Text>

    <TVFocusGuideView autoFocus>
      <FlatList
        horizontal
        initialNumToRender={IN_VIEW}
        maxToRenderPerBatch={IN_VIEW}
        windowSize={3}
        removeClippedSubviews={false}
        data={items}
        keyExtractor={(item) => `${item.kind}:${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.inside}
        style={styles.row}
        renderItem={({ item }) => (
          <MusicTile item={item} onPress={onOpen} {...(onFocus === undefined ? {} : { onFocus })} />
        )}
      />
    </TVFocusGuideView>
  </View>
);

const MusicShelf = memo(MusicShelfRow);

MusicShelf.displayName = 'MusicShelf';

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
    gap: tokens.space.lg,
  },
});

export { MusicShelf };
