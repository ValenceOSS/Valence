import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RequestNowSchema } from '@ValenceContracts/schemas/RequestNow';
import type { RequestNow } from '@ValenceContracts/schemas/RequestNow';

/**
 * Reads what a request is doing right now: which indexers it is asking, how its download is going,
 * or what it is filing.
 *
 * @param id - Which request.
 * @returns What it is doing, or nothing when it is doing nothing.
 */
const fetchMediaRequestNow = (id: string): Promise<RequestNow> =>
  readFromServer(`/api/requests/media/${id}/now`, RequestNowSchema);

export { fetchMediaRequestNow };
