import { readFromServer } from '@ValenceClient/query/readFromServer';
import type { Season } from '@ValenceContracts/constants/SEASONS';
import { LikeThisSchema } from '@ValenceContracts/schemas/Likeness';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Reads the films in the libraries the server ties to a season, best rated first.
 *
 * @param season - Which season.
 * @param limit - How many to ask for.
 * @returns The films, best rated first.
 */
const fetchSeasonalFilms = async (season: Season, limit: number): Promise<MediaSummary[]> =>
  (
    await readFromServer(
      `/api/seasonal-films?season=${season}&limit=${limit.toString()}`,
      LikeThisSchema,
    )
  ).items;

export { fetchSeasonalFilms };
