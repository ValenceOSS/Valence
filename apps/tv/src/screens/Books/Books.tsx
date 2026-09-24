import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { stillListening } from '@ValenceClient/books/stillListening';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookShelf } from '@ValenceTv/components/BookShelf/BookShelf';
import { BookTile } from '@ValenceTv/components/BookTile/BookTile';
import { useAudiobooks } from '@ValenceTv/books/useAudiobooks';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { tokens } from '@ValenceTv/theme/tokens';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { BooksProps } from './Books.types';

const ACROSS = 6;

const RESTS_AFTER_MS = 400;

const HERO = 250;

/**
 * The picture a book lights the page with, where it has one.
 *
 * @param book - The book.
 * @returns Where its cover is served, or nothing.
 */
const moodOf = (book: Book | null): string | null =>
  book?.hasCover === true ? bookCoverUrl(book.id) : null;

/**
 * The books part, for listening: the name of whatever book the remote is on, large, over its
 * cover, then the books somebody is partway through, each saying how far and the chapter they are
 * on, and beneath them every audiobook there is, by title. A book with nothing to hear is left out,
 * a television being for listening to a book rather than reading one.
 *
 * The page is lit by the cover of whatever the remote rests on, once it has rested there a moment
 * rather than at every step.
 *
 * @param libraryIds - The books libraries.
 * @param onOpen - Told which book was chosen.
 * @param onFeature - Told which picture lights the page.
 * @param upTo - The tab this page belongs under, which pressing up from the top row goes to.
 */
const BooksPage = ({ libraryIds, onOpen, onFeature, upTo }: BooksProps) => {
  const { books, isPending } = useAudiobooks(libraryIds);
  const listening = useQuery(bookQueries.listening());
  const screen = useWindowDimensions();
  const room = useRoomToFill();
  const upToBar = useHandOff('up', upTo);
  const [featured, setFeatured] = useState<Book | null>(null);
  const resting = useRef<ReturnType<typeof setTimeout> | null>(null);

  const partway = useMemo(() => stillListening(listening.data ?? []), [listening.data]);
  const shown = featured ?? partway[0]?.book ?? books[0] ?? null;

  useEffect(
    () => () => {
      if (resting.current !== null) {
        clearTimeout(resting.current);
      }
    },
    [],
  );

  useEffect(() => {
    onFeature(moodOf(shown));
  }, [shown, onFeature]);

  const restOn = useCallback((book: Book) => {
    if (resting.current !== null) {
      clearTimeout(resting.current);
    }

    resting.current = setTimeout(() => {
      setFeatured(book);
    }, RESTS_AFTER_MS);
  }, []);

  const restOnShelf = useCallback(
    (book: Book) => {
      upToBar.arrive();
      restOn(book);
    },
    [restOn, upToBar],
  );

  const width = Math.floor(
    (screen.width - tokens.space.edge * 2 - tokens.space.lg * (ACROSS - 1)) / ACROSS,
  );

  if (isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>There are no audiobooks here yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page} onLayout={room.onLayout}>
      <View style={styles.hero}>
        <Text numberOfLines={1} style={styles.name}>
          {shown?.title ?? 'Books'}
        </Text>
        {shown === null ? null : (
          <Text numberOfLines={1} style={styles.detail}>
            {shown.authors?.join(', ') ?? ''}
          </Text>
        )}
      </View>

      {room.height === null ? null : (
        <ScrollView
          style={{ height: room.height - HERO }}
          contentContainerStyle={styles.inside}
          showsVerticalScrollIndicator={false}
        >
          {partway.length === 0 ? null : (
            <BookShelf
              title="Continue listening"
              books={partway}
              onOpen={onOpen}
              onFocus={restOnShelf}
            />
          )}

          <View style={styles.every}>
            <Text style={styles.title}>Every audiobook</Text>

            <TVFocusGuideView autoFocus style={styles.grid}>
              {books.map((book, at) => (
                <BookTile
                  key={book.id}
                  book={book}
                  width={width}
                  isUrgent={at < ACROSS}
                  onPress={onOpen}
                  onFocus={(on) => {
                    restOn(on);

                    if (partway.length === 0 && at < ACROSS) {
                      upToBar.arrive();
                    } else {
                      upToBar.leave();
                    }
                  }}
                />
              ))}
            </TVFocusGuideView>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const Books = memo(BooksPage);

Books.displayName = 'Books';

const styles = StyleSheet.create({
  page: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
  hero: {
    height: HERO,
    justifyContent: 'flex-end',
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.lg,
    gap: tokens.space.xs,
  },
  name: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '800',
    maxWidth: 1300,
  },
  detail: { color: tokens.colours.muted, fontSize: tokens.type.body },
  inside: { paddingBottom: tokens.space.xl, gap: tokens.space.lg },
  every: { gap: tokens.space.xs },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.lg,
    paddingHorizontal: tokens.space.edge,
    paddingTop: tokens.space.md,
  },
});

export { Books };
