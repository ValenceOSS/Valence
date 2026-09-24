import { BookOpen } from '@keyline-icons/react-native';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { ANothingHere } from '@ValencePhone/components/ANothingHere/ANothingHere';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { APosterGrid } from '@ValencePhone/components/APosterGrid/APosterGrid';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { TheBooksProps } from './TheBooks.types';

const styles = StyleSheet.create({
  header: { gap: 20 },
});

/**
 * The books part of the library, as the web's books page lays it out: what this profile is part way
 * through first, carried on from where they stopped with a press, and then every book in the
 * household's book libraries.
 *
 * @param header - What sits above it, which the library draws.
 * @param libraryIds - The household's libraries of books.
 * @param onBook - Told to open a book's page.
 * @param onRead - Told to carry on reading a book.
 * @param onScrolled - Told whether it has been scrolled from its top.
 */
const TheBooks = ({ header, libraryIds, onBook, onRead, onScrolled }: TheBooksProps) => {
  const colours = useTheColours();
  const reading = useQuery(bookQueries.reading());
  const shelves = useQueries({ queries: libraryIds.map((id) => bookQueries.inLibrary(id)) });
  const isReading = shelves.some((shelf) => shelf.isPending);
  const books = shelves
    .flatMap((shelf) => shelf.data ?? [])
    .sort((one, other) => one.title.localeCompare(other.title));
  const carryingOn = (reading.data ?? []).filter((one) => !one.isFinished);

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
            <AShelf title="Continue reading">
              {carryingOn.map((one) => (
                <Button
                  key={one.book.id}
                  tone="bare"
                  label={`Carry on reading ${one.book.title}`}
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

          {books.length === 0 ? null : <Words size="heading">Every book</Words>}

          {isReading ? <ActivityIndicator color={colours.textMuted} /> : null}

          {!isReading && books.length === 0 ? (
            <ANothingHere
              of={BookOpen}
              title="No books yet"
              detail="Once a library of books has been added and scanned, its books will be here."
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
    />
  );
};

TheBooks.displayName = 'TheBooks';

export { TheBooks };
