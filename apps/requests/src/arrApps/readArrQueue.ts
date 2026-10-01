import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import type { ArrQueueRecord } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';

const QUEUE_PAGE = '1000';

/**
 * Everything an app has downloading or waiting to import, read in one page large enough for any
 * queue a household has.
 *
 * @param caller - How to ask the app.
 * @returns Its queue.
 */
const readArrQueue = async (caller: Pick<ArrCaller, 'read'>): Promise<ArrQueueRecord[]> =>
  (await caller.read('/queue', ArrQueuePageSchema, { page: '1', pageSize: QUEUE_PAGE })).records;

export { readArrQueue };
