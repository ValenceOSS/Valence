import type { ArrQueueItem } from '@ValenceContracts/schemas/ArrApp';
import { problemOfQueueRecord } from '@ValenceRequests/arrApps/problemOfQueueRecord';
import { readTimeSpan } from '@ValenceRequests/arrApps/readTimeSpan';
import type { ArrQueueRecord } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';

/**
 * Something in an app's queue as the Downloads panel shows it: its title, how far along it is, its
 * size, how long it has left, its status, and what is wrong with it in the app's own words.
 *
 * @param appId - The app whose queue it is in.
 * @param record - The record, as the app gave it.
 * @returns It as shown.
 */
const queueItemOf = (appId: string, record: ArrQueueRecord): ArrQueueItem => {
  const size = record.size ?? null;
  const left = record.sizeleft ?? null;

  return {
    id: record.id,
    appId,
    title: record.title,
    status: record.trackedDownloadState ?? record.status,
    progress:
      size === null || left === null || size === 0
        ? 0
        : Math.min(1, Math.max(0, (size - left) / size)),
    sizeBytes: size,
    leftBytes: left,
    secondsLeft: readTimeSpan(record.timeleft),
    downloadClient: record.downloadClient ?? null,
    problem: problemOfQueueRecord(record),
  };
};

export { queueItemOf };
