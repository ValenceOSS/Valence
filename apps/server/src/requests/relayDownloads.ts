import type {
  ServiceEvent,
  DownloadQueue,
  DownloadStreamFrame,
} from '@ValenceContracts/schemas/DownloadQueue';

const REMEMBERED = 1000;

type RelayDownloadsOptions = {
  stream: (onFrame: (frame: DownloadStreamFrame) => void, signal: AbortSignal) => Promise<string>;
  onQueue: (queue: DownloadQueue) => void;
  onEvent: (event: ServiceEvent) => void;
  acknowledge: (ids: number[]) => Promise<void>;
  onConnected: () => void;
  onLost: (reason: string) => void;
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
 * @param stream - How the stream is opened, resolving with why it ended.
 * @param onQueue - Told the queue each time it arrives.
 * @param onEvent - Told each event, once.
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

      for (const event of frame.events) {
        if (!handedOn.has(event.id)) {
          handedOn.add(event.id);
          onEvent(event);
        }
      }

      for (const id of [...handedOn].slice(0, Math.max(handedOn.size - REMEMBERED, 0))) {
        handedOn.delete(id);
      }

      void acknowledge(frame.events.map((event) => event.id));
    }, new AbortController().signal);

    onLost(reason);

    if (keepGoing()) {
      await wait(retryMs);
    }
  }
};

export { relayDownloads };
