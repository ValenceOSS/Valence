import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { TranscoderSocket } from '@ValenceServer/transcoder/TranscoderClient';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type RelayMonitorOptions = {
  open: () => Promise<TranscoderSocket | null>;
  publish: (report: JsonValue) => void;
  wait: (afterMs: number) => Promise<void>;
  retryMs: number;
  keepGoing: () => boolean;
};

const readReport = (payload: string): JsonValue | null => {
  try {
    return JsonValueSchema.parse(JSON.parse(payload));
  } catch {
    return null;
  }
};

/**
 * Keeps the transcoder's monitor feed flowing into the admin topic, reopening it whenever it ends.
 *
 * One connection to the transcoder serves every administrator watching, rather than one each. A dead
 * or wedged transcoder is exactly when an operator is looking at this page, so the relay treats the
 * socket closing as ordinary and waits before trying again instead of giving up on the first failure.
 *
 * @param open - How the transcoder's socket is opened.
 * @param publish - Where a parsed report goes.
 * @param wait - How to pause before reopening.
 * @param retryMs - How long to pause.
 * @param keepGoing - Whether to carry on, so shutting down ends the loop.
 */
const relayMonitor = async ({
  open,
  publish,
  wait,
  retryMs,
  keepGoing,
}: RelayMonitorOptions): Promise<void> => {
  while (keepGoing()) {
    try {
      const socket = await open();

      if (socket === null) {
        await wait(retryMs);

        continue;
      }

      await new Promise<void>((resolve) => {
        socket.onMessage((payload) => {
          const report = readReport(payload);

          if (report !== null) {
            publish(report);
          }
        });

        socket.onClose(() => {
          resolve();
        });
      });
    } catch {
      publish({ reachable: false });
    }

    if (keepGoing()) {
      await wait(retryMs);
    }
  }
};

export { relayMonitor };
