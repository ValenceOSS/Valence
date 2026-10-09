import { isEpisodicKind } from '@ValenceContracts/functions/isEpisodicKind';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { QueryClient } from '@tanstack/react-query';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';

/**
 * Finds a programme in whichever library holds it, by its own id or the series it belongs to, for
 * a client that is handed only the one and needs the library to open it. Reads what is already
 * known where it can.
 *
 * @param cache - Where what has been read is kept.
 * @param showId - The programme's id, or its series'.
 * @returns The programme, or null where no library holds it.
 */
const findAShow = async (cache: QueryClient, showId: string): Promise<ShowSummary | null> => {
  const libraries = await cache.ensureQueryData(libraryQueries.all());
  const shelves = await Promise.all(
    libraries
      .filter((library) => isEpisodicKind(library.kind))
      .map((library) => cache.ensureQueryData(libraryQueries.shows(library.id)).catch(() => [])),
  );

  return shelves.flat().find((show) => show.id === showId || show.seriesId === showId) ?? null;
};

export { findAShow };
