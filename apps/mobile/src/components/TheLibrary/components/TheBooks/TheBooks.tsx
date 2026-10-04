import { BookOpen } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import { stillListening } from '@ValenceClient/books/stillListening';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { gatherSeries } from '@ValenceClient/books/gatherSeries';
import { sayCount } from '@ValenceI18n/sayCount';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { APosterGrid } from '@ValenceMobile/components/APosterGrid/APosterGrid';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { BookSeries } from '@ValenceClient/books/gatherSeries';
import type { TheBooksProps } from './TheBooks.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  header: { gap: 20 },
  inSeries: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 8 },
  inSeriesWords: { flex: 1, gap: 2 },
  series: { gap: 4 },
});

const SERIES_COVER = 56;

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
  const shelf = gatherSeries(books);
  const [openSeries, setOpenSeries] = useState<BookSeries | null>(null);
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
    <>
      <APosterGrid
        header={
          <View style={styles.header}>
            {header}

            {carryingOn.length === 0 ? null : (
              <AShelf title={say('common.continueReading')}>
                {carryingOn.map((one) => (
                  <Button
                    key={one.book.id}
                    tone="bare"
                    label={say('phone.theLibrary.theBooks.carryOnReadingTitle', {
                      title: one.book.title,
                    })}
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
              <AShelf title={say('common.continueListening')}>
                {stillHearing.map((one) => (
                  <Button
                    key={one.book.id}
                    tone="bare"
                    label={say('phone.theLibrary.theBooks.carryOnListeningToTitle', {
                      title: one.book.title,
                    })}
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
              <Words size="heading">{say('phone.theLibrary.theBooks.everyBook')}</Words>
            )}

            {isReading ? <ActivityIndicator color={colours.textMuted} /> : null}

            {!isReading && books.length === 0 ? (
              <ANothingHere
                of={BookOpen}
                title={say('phone.theLibrary.theBooks.noBooksYet')}
                detail={say('phone.theLibrary.theBooks.onceALibraryOfBooksHas')}
              />
            ) : null}
          </View>
        }
        items={shelf}
        keyOf={(one) => (one.kind === 'book' ? one.book.id : `series:${one.series.name}`)}
        drawn={(one, width) =>
          one.kind === 'book' ? (
            <Button
              tone="bare"
              label={one.book.title}
              onPress={() => {
                onBook(one.book.id);
              }}
            >
              <APoster
                title={one.book.title}
                year={one.book.year}
                artwork={coverOf(one.book)}
                note={one.book.authors?.[0] ?? null}
                wide={width}
              />
            </Button>
          ) : (
            <Button
              tone="bare"
              label={one.series.name}
              onPress={() => {
                setOpenSeries(one.series);
              }}
            >
              <APoster
                title={one.series.name}
                artwork={one.series.books[0] === undefined ? null : coverOf(one.series.books[0])}
                note={sayCount('common.count.books', one.series.books.length)}
                wide={width}
              />
            </Button>
          )
        }
        {...(onScrolled === undefined ? {} : { onScrolled })}
        {...(onScrolledTo === undefined ? {} : { onScrolledTo })}
      />

      <ASheet
        isOpen={openSeries !== null}
        title={openSeries?.name ?? say('common.aSeries2')}
        onClose={() => {
          setOpenSeries(null);
        }}
      >
        <View style={styles.series}>
          <Words size="small" tone="muted">
            {say('screens.seriesDialog.inOrder')}
          </Words>
          {(openSeries?.books ?? []).map((book) => (
            <Button
              key={book.id}
              tone="bare"
              label={book.title}
              onPress={() => {
                setOpenSeries(null);
                onBook(book.id);
              }}
            >
              <View style={styles.inSeries}>
                <APoster title={book.title} artwork={coverOf(book)} wide={SERIES_COVER} />
                <View style={styles.inSeriesWords}>
                  {book.series?.position === null || book.series?.position === undefined ? null : (
                    <Words size="small" tone="muted">
                      {say('screens.bookRow.bookPosition', {
                        position: String(book.series.position),
                      })}
                    </Words>
                  )}
                  <Words lines={2}>{book.title}</Words>
                </View>
              </View>
            </Button>
          ))}
        </View>
      </ASheet>
    </>
  );
};

TheBooks.displayName = 'TheBooks';

export { TheBooks };
