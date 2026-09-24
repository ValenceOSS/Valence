import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { listeningKept } from '@ValenceClient/books/listeningKept';
import { bookQueries } from '@ValenceClient/query/bookQueries';

/**
 * Reads again where somebody is in their audiobooks each time the player keeps their place, so
 * "continue listening" and a book's own button say where they really are once the server has it.
 */
const useListeningKeptFresh = (): void => {
  const queries = useQueryClient();

  useEffect(
    () =>
      listeningKept.subscribe((bookId) => {
        void queries.invalidateQueries({ queryKey: bookQueries.listening().queryKey });
        void queries.invalidateQueries({ queryKey: bookQueries.listeningPlace(bookId).queryKey });
      }),
    [queries],
  );
};

export { useListeningKeptFresh };
