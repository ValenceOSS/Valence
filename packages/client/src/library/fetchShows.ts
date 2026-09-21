import { readFromServerOrAbsent } from '@ValenceClient/query/readFromServerOrAbsent';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { ComingUpSchema, ShowListSchema, ShowDetailSchema } from '@ValenceContracts/schemas/Show';
import type { ComingUp, ShowDetail, ShowSummary } from '@ValenceContracts/schemas/Show';

/**
 * Reads the programmes in a library, grouped by the server so that a page of sixty things is sixty
 * programmes rather than sixty episodes of one.
 *
 * @param libraryId - The library to read.
 * @returns Its programmes.
 */
const fetchShows = async (libraryId: string): Promise<ShowSummary[]> => {
  return (await readFromServer(`/api/libraries/${libraryId}/shows`, ShowListSchema)).shows;
};

/**
 * Reads one programme and every episode the library holds of it, along with the catalogue's own shape
 * where it knows one, which is what makes a missing episode visible.
 *
 * @param libraryId - The library it is in.
 * @param showId - Which programme.
 * @returns The programme, or null where the library holds no such thing.
 */
const fetchShow = async (libraryId: string, showId: string): Promise<ShowDetail | null> => {
  return readFromServerOrAbsent(`/api/libraries/${libraryId}/shows/${showId}`, ShowDetailSchema);
};

/**
 * Reads the programmes this viewer can watch that have an episode still to air, soonest first, each
 * with the episode and the day it airs.
 *
 * @returns The programmes and their next episodes.
 */
const fetchComingUp = async (): Promise<ComingUp['shows']> =>
  (await readFromServer('/api/coming-up', ComingUpSchema)).shows;

export { fetchComingUp, fetchShows, fetchShow };
