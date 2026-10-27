import { readFromServer } from '@ValenceClient/query/readFromServer';
import { MusicGenreListSchema } from '@ValenceContracts/schemas/Music';

/**
 * Reads the genres of the albums this profile can hear.
 *
 * @returns The genres, A to Z.
 */
const fetchMusicGenres = async (): Promise<string[]> =>
  (await readFromServer('/api/music/genres', MusicGenreListSchema)).genres;

export { fetchMusicGenres };
