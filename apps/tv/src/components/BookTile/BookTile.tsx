import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { tokens } from '@ValenceTv/theme/tokens';
import type { BookTileProps } from './BookTile.types';

const WIDTH = 220;

const TALL = 1.5;

/**
 * An audiobook on a shelf or in a grid: its cover, lifting as the remote lands on it, with its title
 * and who wrote it beneath — or, for one somebody is partway through, a line for how far and the
 * chapter they are on. A book with no cover shows its title where the cover would be.
 *
 * @param book - The book.
 * @param onPress - Told when it is chosen.
 * @param onFocus - Told when the remote lands on it.
 * @param fraction - How far through it somebody is, where they have started it.
 * @param detail - What to say beneath its title in place of who wrote it.
 * @param width - How wide it is; it keeps a cover's proportions.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param isUrgent - Whether its cover is fetched ahead of the others'.
 */
const BookTileCard = ({
  book,
  onPress,
  onFocus,
  fraction,
  detail,
  width = WIDTH,
  hasPreferredFocus = false,
  isUrgent = false,
}: BookTileProps) => {
  const height = Math.round(width * TALL);

  return (
    <Focusable
      label={book.title}
      shadow={{ height, cornerRadius: tokens.radii.md }}
      scale={1.1}
      hasPreferredFocus={hasPreferredFocus}
      onPress={() => {
        onPress(book);
      }}
      onFocus={() => {
        onFocus?.(book);
      }}
    >
      <View style={{ width }}>
        <View style={[styles.cover, { width, height }]}>
          {book.hasCover ? (
            <Artwork
              path={bookCoverUrl(book.id)}
              isUrgent={isUrgent}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <Text numberOfLines={4} style={styles.titled}>
              {book.title}
            </Text>
          )}

          {fraction === undefined ? null : <ProgressLine fraction={fraction} />}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {book.title}
        </Text>
        <Text numberOfLines={1} style={styles.detail}>
          {detail ?? book.authors?.join(', ') ?? ''}
        </Text>
      </View>
    </Focusable>
  );
};

const BookTile = memo(BookTileCard);

BookTile.displayName = 'BookTile';

const styles = StyleSheet.create({
  cover: {
    borderRadius: tokens.radii.md,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
    justifyContent: 'flex-end',
    padding: tokens.space.sm,
  },
  titled: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '700' },
  title: {
    marginTop: tokens.space.md,
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
  },
  detail: { color: tokens.colours.muted, fontSize: tokens.type.small - 2 },
});

export { BookTile };
