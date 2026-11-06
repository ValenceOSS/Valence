import { readFromServer } from '@ValenceClient/query/readFromServer';
import { EpisodeOrdersSchema } from '@ValenceContracts/schemas/EpisodeOrder';
import type { EpisodeOrders } from '@ValenceContracts/schemas/EpisodeOrder';

/**
 * Reads the orders the catalogue has for a programme's episodes, and which is chosen.
 *
 * @param mediaId - Any file of the programme.
 * @returns The orders, and the one chosen or nothing for the catalogue's own.
 */
const fetchEpisodeOrders = (mediaId: string): Promise<EpisodeOrders> =>
  readFromServer(`/api/media/${mediaId}/episode-orders`, EpisodeOrdersSchema);

export { fetchEpisodeOrders };
