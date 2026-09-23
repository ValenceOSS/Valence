import { useQueries, useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';

/**
 * Finds the programme a catalogue series became, which a request knows by its series and a phone
 * opens by its library and programme.
 *
 * @param seriesId - The series, or null where nothing is being looked for.
 * @returns Where the programme is, or null until it is found.
 */
const useTheProgrammeOf = (
  seriesId: string | null,
): { libraryId: string; showId: string } | null => {
  const libraries = useQuery({ ...libraryQueries.all(), enabled: seriesId !== null });
  const holding = (libraries.data ?? []).filter((library) => library.kind === 'shows');
  const lists = useQueries({
    queries: holding.map((library) => ({
      ...libraryQueries.shows(library.id),
      enabled: seriesId !== null,
    })),
  });
  const found = lists
    .flatMap((list) => list.data ?? [])
    .find((programme) => programme.seriesId === seriesId || programme.id === seriesId);

  return found === undefined || seriesId === null
    ? null
    : { libraryId: found.libraryId, showId: found.id };
};

export { useTheProgrammeOf };
