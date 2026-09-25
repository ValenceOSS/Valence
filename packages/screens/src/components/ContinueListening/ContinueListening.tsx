import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import { stillListening } from '@ValenceClient/books/stillListening';
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
  const unfinished = useMemo(() => stillListening(asked.data ?? []), [asked.data]);
  const progress = useMemo(
    () => new Map(unfinished.map(({ book, fraction, detail }) => [book.id, { fraction, detail }])),
    [unfinished],
  );

  if (unfinished.length === 0) {
    return null;
  }

  return (
    <BookRow
      title="Continue listening"
      books={unfinished.map(({ book }) => book)}
      progress={progress}
      onOpen={onOpen}
    />
  );
};

ContinueListening.displayName = 'ContinueListening';

export { ContinueListening };
