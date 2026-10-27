import { randomUUID } from 'node:crypto';
import { saying } from '@ValenceI18n/saying';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type {
  PluginCall,
  PluginCallAnswer,
  PluginCallMethod,
} from '@ValenceContracts/schemas/PluginCall';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';

type CreatePluginCallChannelOptions = {
  patienceMs?: number;
};

type PluginCallChannel = {
  call: (
    pluginId: string,
    clientId: string,
    method: PluginCallMethod,
    ask: JsonValue,
  ) => Promise<{ value: JsonValue; linkHosts: string[] }>;
  listen: (listener: (call: PluginCall) => void) => () => void;
  answer: (id: string, answer: PluginCallAnswer) => boolean;
};

const PATIENCE_MS = 40_000;

/**
 * How the requests service reaches a plugin, which runs in the Valence server and never here. The
 * server keeps a stream open to this service; each call goes down it, and the server posts the
 * plugin's answer back. With no server listening, or none answering in time, the call fails the
 * way a download client that cannot be reached does.
 *
 * @param patienceMs - How long a call waits for its answer.
 * @returns The channel.
 */
const createPluginCallChannel = ({
  patienceMs = PATIENCE_MS,
}: CreatePluginCallChannelOptions = {}): PluginCallChannel => {
  const listeners = new Set<(call: PluginCall) => void>();
  const waiting = new Map<
    string,
    { settle: (answer: PluginCallAnswer) => void; timer: ReturnType<typeof setTimeout> }
  >();

  return {
    call: (pluginId, clientId, method, ask) => {
      if (listeners.size === 0) {
        return Promise.reject(
          new DownloadClientFailure(saying('requests.pluginCalls.valenceIsNotConnectedSoThe')),
        );
      }

      const id = randomUUID();

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          waiting.delete(id);
          reject(new DownloadClientFailure(saying('requests.pluginCalls.thePluginDidNotAnswerIn')));
        }, patienceMs);

        waiting.set(id, {
          timer,
          settle: (answer) => {
            clearTimeout(timer);
            waiting.delete(id);

            if (answer.ok) {
              resolve({ value: answer.value, linkHosts: answer.linkHosts });
            } else {
              reject(new DownloadClientFailure(answer.problem));
            }
          },
        });

        for (const listener of listeners) {
          listener({ id, pluginId, clientId, method, ask });
        }
      });
    },

    listen: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    answer: (id, answer) => {
      const held = waiting.get(id);

      held?.settle(answer);

      return held !== undefined;
    },
  };
};

export type { PluginCallChannel };

export { createPluginCallChannel };
