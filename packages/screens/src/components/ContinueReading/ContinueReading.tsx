import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import type { ContinueReadingProps } from './ContinueReading.types';

/**
 * The books somebody is partway through, most recently opened first, each saying how far they got —
 * the reading counterpart of a film half watched. Nothing is drawn until there is something to carry
 * on with, so a shelf nobody has opened yet starts with its books.
 *
 * @param onOpen - Told which book was chosen.
 */
const ContinueReading = ({ onOpen }: ContinueReadingProps) => {
  const asked = useQuery(bookQueries.reading());
  const unfinished = useMemo(
    () => (asked.data ?? []).filter((reading) => !reading.isFinished),
    [asked.data],
  );
  const progress = useMemo(
    () =>
      new Map(
        unfinished.map((reading) => [
          reading.book.id,
          { fraction: readingFractionOf(reading), detail: describeReadingPlace(reading) },
        ]),
      ),
    [unfinished],
  );

  if (unfinished.length === 0) {
    return null;
  }

  return (
    <BookRow
      title="Continue reading"
      books={unfinished.map((reading) => reading.book)}
      progress={progress}
      onOpen={onOpen}
    />
  );
};

ContinueReading.displayName = 'ContinueReading';

export { ContinueReading };
