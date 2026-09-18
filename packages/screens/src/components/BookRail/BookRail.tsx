import { useQuery } from '@tanstack/react-query';
import { Rail } from '@ValenceUI/Rail';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Skeleton } from '@ValenceUI/Skeleton';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import type { BookRailProps } from './BookRail.types';

const WAITING = 6;

/**
 * One shelf of books, drawn the way the rest of the library is drawn.
 *
 * The cards are the poster shape rather than the wide one, because a book is taller than it is
 * across: the covers in this library measure 3311 by 4717, which is a shade taller than two by three
 * and nothing like the shape a film is shown in.
 *
 * A comic's cover is the first page of its first chapter, which is what a comic archive actually
 * holds — there is no separate artwork in one. An ebook's is the picture it declares as its cover.
 *
 * Under a comic goes how many chapters it has, which is what somebody picking a volume wants to know;
 * under an ebook goes who wrote it, since an ebook is a single file and "1 chapter" says nothing.
 *
 * @param libraryId - Which shelf.
 * @param title - What to call it.
 * @param onOpen - Told which book somebody wants to read.
 */
const BookRail = ({ libraryId, title, onOpen }: BookRailProps) => {
  const asked = useQuery(bookQueries.inLibrary(libraryId));

  if (asked.isError) {
    return (
      <Rail title={title}>
        <CouldNotRead
          what="That shelf"
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      </Rail>
    );
  }

  if (asked.data === undefined) {
    return (
      <Rail title={title}>
        {Array.from({ length: WAITING }, (_, at) => (
          <Skeleton key={at} className="aspect-[2/3] w-40 shrink-0 rounded-lg" />
        ))}
      </Rail>
    );
  }

  if (asked.data.length === 0) {
    return null;
  }

  return (
    <Rail title={title}>
      {asked.data.map((book) => (
        <MediaCard
          key={book.id}
          title={book.title}
          shape="poster"
          imageUrl={bookCoverUrl(book.id)}
          subtitle={
            book.layout === 'reflow'
              ? book.authors === null || book.authors.length === 0
                ? 'Ebook'
                : book.authors.join(', ')
              : book.chapterCount === 1
                ? '1 chapter'
                : `${book.chapterCount.toString()} chapters`
          }
          {...(book.year === null ? {} : { eyebrow: book.year.toString() })}
          onSelect={() => {
            onOpen(book);
          }}
          className="w-40 shrink-0"
        />
      ))}
    </Rail>
  );
};

BookRail.displayName = 'BookRail';

export { BookRail };
