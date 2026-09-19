import { readFromServer } from '@ValenceClient/query/readFromServer';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import { DownloadQueueSchema, QueuedDownloadSchema } from '@ValenceContracts/schemas/DownloadQueue';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type {
  DownloadQueue,
  QueuedDownload,
  ReleaseSend,
} from '@ValenceContracts/schemas/DownloadQueue';

const DOWNLOADS = '/api/admin/requests/downloads';

/**
 * Reads every download Valence has sent, and how each download client is.
 *
 * @returns The queue.
 */
const fetchDownloadQueue = (): Promise<DownloadQueue> =>
  readFromServer(DOWNLOADS, DownloadQueueSchema);

/**
 * Sends a release to a download client — the first one switched on that takes its kind, unless one
 * is named.
 *
 * @param release - The release, and where it was found.
 * @returns The download, or why it was not sent.
 */
const sendRelease = (release: ReleaseSend): Promise<Sent<QueuedDownload>> =>
  sendToRequests(DOWNLOADS, 'POST', release, async (response) =>
    QueuedDownloadSchema.parse(await response.json()),
  );

/**
 * Pauses a download in its client.
 *
 * @param id - Which.
 * @returns The download as its client now has it, or why not.
 */
const pauseQueuedDownload = (id: string): Promise<Sent<QueuedDownload>> =>
  sendToRequests(`${DOWNLOADS}/${id}/pause`, 'POST', undefined, async (response) =>
    QueuedDownloadSchema.parse(await response.json()),
  );

/**
 * Resumes a download in its client.
 *
 * @param id - Which.
 * @returns The download as its client now has it, or why not.
 */
const resumeQueuedDownload = (id: string): Promise<Sent<QueuedDownload>> =>
  sendToRequests(`${DOWNLOADS}/${id}/resume`, 'POST', undefined, async (response) =>
    QueuedDownloadSchema.parse(await response.json()),
  );

/**
 * Takes a download out of its client and the queue.
 *
 * @param id - Which.
 * @param deleteData - Whether to delete what it downloaded as well.
 * @returns Why not, where it was refused.
 */
const removeQueuedDownload = async (id: string, deleteData: boolean): Promise<Refusal> =>
  (
    await sendToRequests(
      `${DOWNLOADS}/${id}?deleteData=${deleteData ? 'true' : 'false'}`,
      'DELETE',
      undefined,
      () => Promise.resolve(null),
    )
  ).refusal;

/**
 * Follows the queue as the download clients report it, calling back with the whole of it each time
 * rather than being asked — which is also what tells the server somebody is watching, so the
 * clients are asked every couple of seconds only while this is held.
 *
 * @param onQueue - Told the queue each time it arrives.
 * @param client - The connection to watch over, which is the shared one unless a test says otherwise.
 * @returns The function that stops watching.
 */
const watchDownloadQueue = (
  onQueue: (queue: DownloadQueue) => void,
  client: Pick<RealtimeClient, 'subscribe'> = getRealtimeClient(),
): (() => void) =>
  client.subscribe('downloads', (event) => {
    const parsed = DownloadQueueSchema.safeParse(event.payload);

    if (parsed.success) {
      onQueue(parsed.data);
    }
  });

export {
  fetchDownloadQueue,
  pauseQueuedDownload,
  removeQueuedDownload,
  resumeQueuedDownload,
  sendRelease,
  watchDownloadQueue,
};
