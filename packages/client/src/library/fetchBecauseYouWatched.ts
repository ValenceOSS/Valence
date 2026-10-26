import { readFromServer } from '@ValenceClient/query/readFromServer';
import { BecauseYouWatchedSchema } from '@ValenceContracts/schemas/Likeness';
import type { BecauseYouWatchedRow } from '@ValenceContracts/schemas/Likeness';

/**
 * Reads the rows of titles like those this profile watched lately.
 *
 * @returns A row for each title watched lately that has enough like it, latest first.
 */
const fetchBecauseYouWatched = async (): Promise<BecauseYouWatchedRow[]> =>
  (await readFromServer('/api/because-you-watched', BecauseYouWatchedSchema)).rows;

export { fetchBecauseYouWatched };
