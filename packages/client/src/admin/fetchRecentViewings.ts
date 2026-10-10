import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RecentViewingListSchema } from '@ValenceContracts/schemas/RecentViewing';
import type { RecentViewing } from '@ValenceContracts/schemas/RecentViewing';

/**
 * What was watched lately across every profile on the server: who watched it, on what, when and
 * for how long, newest first.
 *
 * @returns The viewings.
 */
const fetchRecentViewings = async (): Promise<RecentViewing[]> =>
  (await readFromServer('/api/admin/history', RecentViewingListSchema)).viewings;

export { fetchRecentViewings };
