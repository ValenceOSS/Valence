import { Rail } from '@ValenceUI/Rail';
import { MediaCard } from '@ValenceUI/MediaCard';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { BookRowProps } from './BookRow.types';

/**
 * What goes under a book on a shelf: who wrote an ebook, or how many chapters a comic has.
 *
 * @param book - The book.
 * @returns The line under its cover.
 */
const describeOnShelf = (book: Book): string =>
  book.layout === 'reflow'
    ? book.authors === null || book.authors.length === 0
      ? 'Ebook'
      : book.authors.join(', ')
    : book.chapterCount === 1
      ? '1 chapter'
      : `${book.chapterCount.toString()} chapters`;

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
 * @param title - What to call the row.
 * @param books - The books in it.
 * @param progress - How far through each book somebody is, where they have started it.
 * @param onOpen - Told which book was chosen.
 */
const BookRow = ({ title, books, progress, onOpen }: BookRowProps) => (
  <Rail title={title}>
    {books.map((book) => {
      const where = progress?.get(book.id);

      return (
        <MediaCard
          key={book.id}
          title={book.title}
          shape="poster"
          imageUrl={bookCoverUrl(book.id)}
          subtitle={where?.detail ?? describeOnShelf(book)}
          {...(where === undefined ? {} : { watchedFraction: where.fraction })}
          {...(book.year === null ? {} : { eyebrow: book.year.toString() })}
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
