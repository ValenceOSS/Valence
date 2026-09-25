import { BookOpen } from '@keyline-icons/react-native';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import { stillListening } from '@ValenceClient/books/stillListening';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { APosterGrid } from '@ValenceMobile/components/APosterGrid/APosterGrid';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { TheBooksProps } from './TheBooks.types';

const styles = StyleSheet.create({
  header: { gap: 20 },
});

/**
 * The books part of the library, as the web's books page lays it out: what this profile is part way
 * through reading and then listening to first, each carried on from where they stopped with a
 * press, and then every book in the household's book libraries.
 *
 * @param header - What sits above it, which the library draws.
 * @param libraryIds - The household's libraries of books.
 * @param onBook - Told to open a book's page.
 * @param onRead - Told to carry on reading a book.
 * @param onListen - Told to carry on listening to a book.
 * @param onScrolled - Told whether it has been scrolled from its top.
 * @param onScrolledTo - Told how far down it has been scrolled, as it scrolls.
 */
const TheBooks = ({
  header,
  libraryIds,
  onBook,
  onRead,
  onListen,
  onScrolled,
  onScrolledTo,
}: TheBooksProps) => {
  const colours = useTheColours();
  const reading = useQuery(bookQueries.reading());
  const listening = useQuery(bookQueries.listening());
  const shelves = useQueries({ queries: libraryIds.map((id) => bookQueries.inLibrary(id)) });
  const isReading = shelves.some((shelf) => shelf.isPending);
  const books = shelves
    .flatMap((shelf) => shelf.data ?? [])
    .sort((one, other) => one.title.localeCompare(other.title));
  const carryingOn = (reading.data ?? []).filter((one) => !one.isFinished);
  const stillHearing = stillListening(listening.data ?? []);

  /**
   * A book's cover, or nothing where it has none.
   *
   * @param book - The book.
   * @returns Where its cover is.
   */
  const coverOf = (book: Book) => (book.hasCover ? onThisServer(bookCoverUrl(book.id)) : null);

  return (
    <APosterGrid
      header={
        <View style={styles.header}>
          {header}

          {carryingOn.length === 0 ? null : (
            <AShelf title={say('phone.theBooks.continueReading')}>
              {carryingOn.map((one) => (
                <Button
                  key={one.book.id}
                  tone="bare"
                  label={say('phone.theBooks.carryOnReading', { title: one.book.title })}
                  onPress={() => {
                    onRead(one.book.id);
                  }}
                >
                  <APoster
                    title={one.book.title}
                    artwork={coverOf(one.book)}
                    watched={readingFractionOf(one)}
                    note={describeReadingPlace(one)}
                  />
                </Button>
              ))}
            </AShelf>
          )}

          {stillHearing.length === 0 ? null : (
            <AShelf title={say('phone.theBooks.continueListening')}>
              {stillHearing.map((one) => (
                <Button
                  key={one.book.id}
                  tone="bare"
                  label={say('phone.theBooks.carryOnListening', { title: one.book.title })}
                  onPress={() => {
                    onListen(one.book.id);
                  }}
                >
                  <APoster
                    title={one.book.title}
                    artwork={coverOf(one.book)}
                    watched={one.fraction}
                    note={one.detail}
                  />
                </Button>
              ))}
            </AShelf>
          )}

          {books.length === 0 ? null : (
            <Words size="heading">{say('phone.theBooks.everyBook')}</Words>
          )}

          {isReading ? <ActivityIndicator color={colours.textMuted} /> : null}

          {!isReading && books.length === 0 ? (
            <ANothingHere
              of={BookOpen}
              title={say('phone.theBooks.emptyTitle')}
              detail={say('phone.theBooks.emptyDetail')}
            />
          ) : null}
        </View>
      }
      items={books}
      keyOf={(book) => book.id}
      drawn={(book, width) => (
        <Button
          tone="bare"
          label={book.title}
          onPress={() => {
            onBook(book.id);
          }}
        >
          <APoster
            title={book.title}
            year={book.year}
            artwork={coverOf(book)}
            note={book.authors?.[0] ?? null}
            wide={width}
          />
        </Button>
      )}
      {...(onScrolled === undefined ? {} : { onScrolled })}
      {...(onScrolledTo === undefined ? {} : { onScrolledTo })}
    />
  );
};

TheBooks.displayName = 'TheBooks';

export { TheBooks };
