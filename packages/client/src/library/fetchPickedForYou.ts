import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LikeThisSchema } from '@ValenceContracts/schemas/Likeness';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Reads the films and programmes the server reckons this profile is likeliest to enjoy, a programme
 * by its first episode.
 *
 * @param limit - How many to ask for.
 * @returns The titles, best first.
 */
const fetchPickedForYou = async (limit: number): Promise<MediaSummary[]> =>
  (await readFromServer(`/api/picked-for-you?limit=${limit.toString()}`, LikeThisSchema)).items;

export { fetchPickedForYou };
