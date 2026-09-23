import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Rail } from '@ValenceUI/Rail';
import { Skeleton } from '@ValenceUI/Skeleton';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { SeriesDialog } from '@ValenceScreens/components/SeriesDialog/SeriesDialog';
import type { BookSeries } from '@ValenceScreens/reading/gatherSeries';
import type { BookRailProps } from './BookRail.types';

const WAITING = 6;

/**
 * One library's shelf of books, drawn as a row of them once they have been read off the server, with
 * a row of empty cards while they are on their way. The books that are one series share a card,
 * which opens onto the series in order.
 *
 * @param libraryId - Which shelf.
 * @param title - What to call it.
 * @param onOpen - Told which book somebody wants to read.
 */
const BookRail = ({ libraryId, title, onOpen }: BookRailProps) => {
  const asked = useQuery(bookQueries.inLibrary(libraryId));
  const [openSeries, setOpenSeries] = useState<BookSeries | null>(null);

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
          <Skeleton key={at} className="aspect-[2/3] w-40 shrink-0" />
        ))}
      </Rail>
    );
  }

  if (asked.data.length === 0) {
    return null;
  }

  return (
    <>
      <BookRow title={title} books={asked.data} onOpen={onOpen} onOpenSeries={setOpenSeries} />

      <SeriesDialog
        series={openSeries}
        onClose={() => {
          setOpenSeries(null);
        }}
        onOpen={(book) => {
          setOpenSeries(null);
          onOpen(book);
        }}
      />
    </>
  );
};

BookRail.displayName = 'BookRail';

export { BookRail };
