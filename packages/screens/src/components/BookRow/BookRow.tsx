import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { Rail } from '@ValenceUI/Rail';
import { MediaCard } from '@ValenceUI/MediaCard';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { gatherSeries } from '@ValenceScreens/reading/gatherSeries';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { BookRowProps } from './BookRow.types';

/**
 * What goes under a book on a shelf: who wrote an ebook or an audiobook, or how many chapters a
 * comic has.
 *
 * @param book - The book.
 * @returns The line under its cover.
 */
const describeOnShelf = (book: Book): string =>
  book.layout === 'reflow' || book.layout === 'audio'
    ? book.authors === null || book.authors.length === 0
      ? book.layout === 'audio'
        ? say('screens.bookRow.audiobook')
        : say('screens.bookRow.ebook')
      : book.authors.join(', ')
    : sayCount('screens.bookRow.chapterCount', book.chapterCount);

/**
 * What goes above a book on a shelf: its place in its series, on a shelf of one series, and
 * otherwise the year it came out.
 *
 * @param book - The book.
 * @param isNumbered - Whether the shelf is one series in order.
 * @returns The words, or nothing.
 */
const eyebrowOf = (book: Book, isNumbered: boolean): string | null =>
  isNumbered && typeof book.series?.position === 'number'
    ? say('screens.bookRow.seriesPosition', { position: book.series.position.toString() })
    : (book.year?.toString() ?? null);

/**
 * A row of books drawn the way the rest of the library is drawn.
 *
 * The cards are the poster shape rather than the wide one, because a book is taller than it is
 * across: the covers in this library measure 3311 by 4717, which is a shade taller than two by three
 * and nothing like the shape a film is shown in.
 *
 * Under a comic goes how many chapters it has, which is what somebody picking a volume wants to know;
 * under an ebook goes who wrote it, since an ebook is a single file and "1 chapter" says nothing.
 * Where somebody is partway through a book, the card says how far and draws the bar a film's does.
 *
 * Given somewhere to open a series, the books that are one series are gathered into a single card,
 * wearing its first book's cover and saying how many books it holds, where its first book would
 * have been. A row of one series in order says each book's place in it above its cover.
 *
 * @param title - What to call the row.
 * @param books - The books in it.
 * @param progress - How far through each book somebody is, where they have started it.
 * @param onOpen - Told which book was chosen.
 * @param onOpenSeries - Told which series was chosen, which gathers each series into one card.
 * @param isNumbered - Whether the row is one series in order, which puts each book's place on it.
 */
const BookRow = ({
  title,
  books,
  progress,
  onOpen,
  onOpenSeries,
  isNumbered = false,
}: BookRowProps) => (
  <Rail title={title}>
    {(onOpenSeries === undefined
      ? books.map((book) => ({ kind: 'book' as const, book }))
      : gatherSeries(books)
    ).map((shown) => {
      if (shown.kind === 'series') {
        const { series } = shown;
        const [first] = series.books;
        const authors = [...new Set(series.books.flatMap((book) => book.authors ?? []))];

        return (
          <MediaCard
            key={`series-${series.name}`}
            title={series.name}
            shape="poster"
            {...(first === undefined ? {} : { imageUrl: bookCoverUrl(first.id) })}
            subtitle={[
              sayCount('screens.bookRow.seriesBooks', series.books.length),
              ...authors,
            ].join(' · ')}
            onSelect={() => {
              onOpenSeries?.(series);
            }}
            className="w-40 shrink-0"
          />
        );
      }

      const { book } = shown;
      const where = progress?.get(book.id);
      const eyebrow = eyebrowOf(book, isNumbered);

      return (
        <MediaCard
          key={book.id}
          title={book.title}
          shape="poster"
          imageUrl={bookCoverUrl(book.id)}
          subtitle={where?.detail ?? describeOnShelf(book)}
          {...(where === undefined ? {} : { watchedFraction: where.fraction })}
          {...(eyebrow === null ? {} : { eyebrow })}
          onSelect={() => {
            onOpen(book);
          }}
          className="w-40 shrink-0"
        />
      );
    })}
  </Rail>
);

BookRow.displayName = 'BookRow';

export { BookRow };
