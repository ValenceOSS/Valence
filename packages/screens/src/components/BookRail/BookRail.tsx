import { useQuery } from '@tanstack/react-query';
import { Rail } from '@ValenceUI/Rail';
import { Skeleton } from '@ValenceUI/Skeleton';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import type { BookRailProps } from './BookRail.types';

const WAITING = 6;

/**
 * One library's shelf of books, drawn as a row of them once they have been read off the server, with
 * a row of empty cards while they are on their way.
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

  return <BookRow title={title} books={asked.data} onOpen={onOpen} />;
};

BookRail.displayName = 'BookRail';

export { BookRail };
