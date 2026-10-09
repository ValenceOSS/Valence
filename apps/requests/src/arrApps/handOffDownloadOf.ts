import type { HandOffDownload } from '@ValenceContracts/schemas/ArrApp';
import { problemOfQueueRecord } from '@ValenceRequests/arrApps/problemOfQueueRecord';
import type { ArrQueueRecord } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { secondsOfTimeLeft } from '@ValenceRequests/arrApps/secondsOfTimeLeft';

/**
 * One download in a connected app's queue as a title's page shows it: what it is, which of the
 * request's items it holds, and how far along it is.
 *
 * @param record - The queue record.
 * @param itemIds - The request's items it holds.
 * @param appName - The app, named where its download client is not.
 * @returns The download.
 */
const handOffDownloadOf = (
  record: ArrQueueRecord,
  itemIds: readonly string[],
  appName: string,
): HandOffDownload => {
  const size = record.size ?? null;
  const left = record.sizeleft ?? null;

  return {
    id: record.id.toString(),
    releaseTitle: record.title,
    itemIds: [...itemIds],
    clientName: record.downloadClient ?? appName,
    progress:
      size === null || left === null || size === 0
        ? 0
        : Math.min(1, Math.max(0, (size - left) / size)),
    sizeBytes: size,
    secondsLeft: secondsOfTimeLeft(record.timeleft),
    problem: problemOfQueueRecord(record),
  };
};

export { handOffDownloadOf };
