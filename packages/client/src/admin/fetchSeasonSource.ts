import { readFromServer } from '@ValenceClient/query/readFromServer';
import { SeasonSourceStateSchema } from '@ValenceContracts/schemas/SeasonSource';
import type { SeasonSourceState } from '@ValenceContracts/schemas/SeasonSource';

/**
 * Reads which catalogue entry's season a season is read from, where it is another's.
 *
 * @param mediaId - Any episode of the season.
 * @returns The entry and its season, or nothing where it is the show's own.
 */
const fetchSeasonSource = (mediaId: string): Promise<SeasonSourceState> =>
  readFromServer(`/api/media/${mediaId}/season-source`, SeasonSourceStateSchema);

export { fetchSeasonSource };
