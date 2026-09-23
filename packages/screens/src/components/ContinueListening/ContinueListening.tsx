import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { describeListeningPlace } from '@ValenceScreens/listening/describeListeningPlace';
import type { ContinueListeningProps } from './ContinueListening.types';

/**
 * The audiobooks somebody is partway through, most recently heard first, each saying the chapter
 * they are on and how long is left — the listening counterpart of "continue reading". Nothing is
 * drawn until there is something to carry on with.
 *
 * @param onOpen - Told which book was chosen.
 */
const ContinueListening = ({ onOpen }: ContinueListeningProps) => {
  const asked = useQuery(bookQueries.listening());
  const unfinished = useMemo(
    () => (asked.data ?? []).filter((listening) => !listening.isFinished),
    [asked.data],
  );
  const progress = useMemo(
    () =>
      new Map(
        unfinished.map((listening) => [
          listening.book.id,
          {
            fraction:
              listening.durationSeconds > 0
                ? Math.min(listening.heardSeconds / listening.durationSeconds, 1)
                : 0,
            detail: describeListeningPlace(listening),
          },
        ]),
      ),
    [unfinished],
  );

  if (unfinished.length === 0) {
    return null;
  }

  return (
    <BookRow
      title="Continue listening"
      books={unfinished.map((listening) => listening.book)}
      progress={progress}
      onOpen={onOpen}
    />
  );
};

ContinueListening.displayName = 'ContinueListening';

export { ContinueListening };
