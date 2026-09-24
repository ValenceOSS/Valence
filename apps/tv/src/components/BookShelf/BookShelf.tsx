import { memo } from 'react';
import { FlatList, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { BookTile } from '@ValenceTv/components/BookTile/BookTile';
import { tokens } from '@ValenceTv/theme/tokens';
import type { BookShelfProps } from './BookShelf.types';

const IN_VIEW = 8;

/**
 * A named row of audiobooks for the remote to move along, which catches the remote across the
 * whole width of the screen as the television's other shelves do.
 *
 * @param title - What the row is.
 * @param books - What is on it, each with how far through it somebody is where that is shown.
 * @param onOpen - Told which was chosen.
 * @param onFocus - Told which the remote is on.
 */
const BookShelfRow = ({ title, books, onOpen, onFocus }: BookShelfProps) => (
  <View style={styles.shelf}>
    <Text style={styles.title}>{title}</Text>

    <TVFocusGuideView autoFocus>
      <FlatList
        horizontal
        initialNumToRender={IN_VIEW}
        maxToRenderPerBatch={IN_VIEW}
        windowSize={3}
        removeClippedSubviews={false}
        data={books}
        keyExtractor={({ book }) => book.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.inside}
        style={styles.row}
        renderItem={({ item }) => (
          <BookTile
            book={item.book}
            onPress={onOpen}
            {...(item.fraction === undefined ? {} : { fraction: item.fraction })}
            {...(item.detail === undefined ? {} : { detail: item.detail })}
            {...(onFocus === undefined ? {} : { onFocus })}
          />
        )}
      />
    </TVFocusGuideView>
  </View>
);

const BookShelf = memo(BookShelfRow);

BookShelf.displayName = 'BookShelf';

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

export { BookShelf };
