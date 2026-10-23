import type { Said } from '@ValenceI18n/SaidSchema';
import type {
  ServiceEvent,
  DownloadQueue,
  DownloadStreamFrame,
} from '@ValenceContracts/schemas/DownloadQueue';

const REMEMBERED = 1000;

type RelayDownloadsOptions = {
  stream: (onFrame: (frame: DownloadStreamFrame) => void, signal: AbortSignal) => Promise<Said>;
  onQueue: (queue: DownloadQueue) => void;
  onEvent: (event: ServiceEvent) => void | Promise<void>;
  acknowledge: (ids: number[]) => Promise<void>;
  onConnected: () => void;
  onLost: (reason: Said) => void;
  wait: (afterMs: number) => Promise<void>;
  retryMs: number;
  keepGoing: () => boolean;
};

/**
 * Keeps one stream open to the requests service's download queue, reopening it whenever it ends,
 * and hands on what comes down it: the queue as it changes, and each event once.
 *
 * The service keeps an event until it is acknowledged, so an event can arrive again — after an
 * acknowledgement that did not land, or on the next stream. Each is handed on the first time only,
 * and acknowledged every time it is seen; the last thousand are remembered, which is far more than
 * can be in flight at once.
 *
 * An event is acknowledged only once it has been handled. One whose handling fails is left
 * unacknowledged and forgotten, so the service sends it again and it is handled then: a download
 * filed while the database could not take the scan it asks for was otherwise acknowledged anyway,
 * and the library never heard of it.
 *
 * @param stream - How the stream is opened, resolving with why it ended.
 * @param onQueue - Told the queue each time it arrives.
 * @param onEvent - Told each event, once, and waited on before it is acknowledged.
 * @param acknowledge - How to tell the service events were heard.
 * @param onConnected - Told when a stream has opened and said something.
 * @param onLost - Told why a stream ended.
 * @param wait - How to pause before reopening.
 * @param retryMs - How long to pause.
 * @param keepGoing - Whether to carry on, so shutting down ends the loop.
 */
const relayDownloads = async ({
  stream,
  onQueue,
  onEvent,
  acknowledge,
  onConnected,
  onLost,
  wait,
  retryMs,
  keepGoing,
}: RelayDownloadsOptions): Promise<void> => {
  const handedOn = new Set<number>();
  let settled: Promise<void> = Promise.resolve();

  while (keepGoing()) {
    let isFresh = true;

    const reason = await stream((frame) => {
      if (isFresh) {
        isFresh = false;
        onConnected();
      }

      if (frame.kind === 'queue') {
        onQueue(frame.queue);

        return;
      }

      const fresh = frame.events.filter((event) => !handedOn.has(event.id));

      for (const event of fresh) {
        handedOn.add(event.id);
      }

      for (const id of [...handedOn].slice(0, Math.max(handedOn.size - REMEMBERED, 0))) {
        handedOn.delete(id);
      }

      settled = settled.then(async () => {
        const failed = new Set<number>();

        for (const event of fresh) {
          await Promise.resolve(onEvent(event)).catch(() => {
            failed.add(event.id);
            handedOn.delete(event.id);
          });
        }

        await acknowledge(
          frame.events.map((event) => event.id).filter((id) => !failed.has(id)),
        ).catch(() => undefined);
      });
    }, new AbortController().signal);

    await settled;

    onLost(reason);

    if (keepGoing()) {
      await wait(retryMs);
    }
  }
};

export { relayDownloads };
