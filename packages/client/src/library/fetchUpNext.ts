import { readFromServer } from '@ValenceClient/query/readFromServer';
import { UpNextSchema } from '@ValenceContracts/schemas/Show';
import type { UpNext } from '@ValenceContracts/schemas/Show';

/**
 * Reads the episode that comes next in each programme this viewer is part way through, each with
 * when the one before it was last watched.
 *
 * @returns The episodes, most recently carried on with first.
 */
const fetchUpNext = async (): Promise<UpNext['episodes']> =>
  (await readFromServer('/api/up-next', UpNextSchema)).episodes;

export { fetchUpNext };
