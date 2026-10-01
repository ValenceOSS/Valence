import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { ArrQueueRecord } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';

const TROUBLED = new Set(['warning', 'error', 'failed']);

/**
 * What an app says is wrong with something in its queue, in its own words, where it says anything
 * is: a download its client reports failing, or one it cannot import.
 *
 * @param record - The queue record.
 * @returns The problem, or null where all is well.
 */
const problemOfQueueRecord = (record: ArrQueueRecord): Said | null => {
  if (
    !TROUBLED.has(record.status.toLowerCase()) &&
    !TROUBLED.has((record.trackedDownloadStatus ?? '').toLowerCase())
  ) {
    return null;
  }

  const said = [
    ...record.statusMessages.flatMap((message) =>
      message.messages.length === 0 ? [message.title ?? ''] : message.messages,
    ),
    record.errorMessage ?? '',
  ]
    .map((line) => line.trim())
    .filter((line, index, all) => line !== '' && all.indexOf(line) === index);

  return said.length === 0 ? sayVerbatim(record.status) : sayVerbatim(said.join(' '));
};

export { problemOfQueueRecord };
