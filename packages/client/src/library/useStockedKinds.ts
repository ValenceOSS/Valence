import { isVideoKind } from '@ValenceContracts/functions/isVideoKind';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

type StockedKinds = { films: boolean; shows: boolean; books: boolean; music: boolean };

/**
 * Which kinds of thing this server has something of, so a client offers a section only for what it
 * holds: a library that is there but empty, or not there at all, gets no section to land on nothing.
 *
 * Films are asked about rather than counted, since a film can stand in a library of programmes and
 * a films library can hold nothing yet. The rest are counted from the libraries of their kind.
 *
 * @returns What there is something of, or null until the server has said.
 */
const useStockedKinds = (): StockedKinds | null => {
  const libraries = useQuery(libraryQueries.all());
  const watchable = useMemo(
    () => (libraries.data ?? []).filter((one) => isVideoKind(one.kind)).map((one) => one.id),
    [libraries.data],
  );
  const anyFilm = useQuery({
    ...libraryQueries.across(watchable, { kind: 'films', limit: 1 }),
    enabled: watchable.length > 0,
  });

  if (libraries.data === undefined || anyFilm.isLoading) {
    return null;
  }

  const every = libraries.data;
  const holds = (kind: LibraryKind) => every.some((one) => one.kind === kind && one.itemCount > 0);

  return {
    films: (anyFilm.data ?? []).length > 0,
    shows: holds('shows') || holds('anime'),
    books: holds('books'),
    music: holds('music'),
  };
};

export type { StockedKinds };

export { useStockedKinds };
