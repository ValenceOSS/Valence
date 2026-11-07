import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { ReadingHero } from '@ValenceScreens/components/ContinueReading/components/ReadingHero/ReadingHero';
import { describeReadingPlace } from '@ValenceClient/books/describeReadingPlace';
import { readingFractionOf } from '@ValenceClient/books/readingFractionOf';
import type { ContinueReadingProps } from './ContinueReading.types';
import { say } from '@ValenceI18n/say';

/**
 * The books somebody is partway through, most recently opened first: the last one large, with a
 * button to carry on, and the rest in a row beneath it, each saying how far they got — the reading
 * counterpart of a film half watched. Nothing is drawn until there is something to carry
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

  const [latest, ...others] = unfinished;

  if (latest === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <ReadingHero reading={latest} onOpen={onOpen} />

      {others.length === 0 ? null : (
        <BookRow
          title={say('screens.readingHero.alsoReading')}
          books={others.map((reading) => reading.book)}
          progress={progress}
          onOpen={onOpen}
        />
      )}
    </div>
  );
};

ContinueReading.displayName = 'ContinueReading';

export { ContinueReading };
