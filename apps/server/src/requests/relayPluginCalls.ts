import type { Said } from '@ValenceI18n/SaidSchema';
import type { PluginCall, PluginCallAnswer } from '@ValenceContracts/schemas/PluginCall';

type RelayPluginCallsOptions = {
  stream: (onCall: (call: PluginCall) => void, signal: AbortSignal) => Promise<Said>;
  answer: (call: PluginCall) => Promise<PluginCallAnswer>;
  post: (id: string, answer: PluginCallAnswer) => Promise<object | null>;
  onLost: (reason: Said) => void;
  wait: (afterMs: number) => Promise<void>;
  retryMs: number;
  keepGoing: () => boolean;
};

/**
 * Keeps one stream open to the requests service's plugin calls, reopening it whenever it ends,
 * and answers each call as it comes: the plugin is asked, and what it said is posted back to the
 * call waiting for it. Calls are answered side by side, so one slow plugin holds up no other.
 *
 * @param stream - How the stream is opened, resolving with why it ended.
 * @param answer - How a call is answered.
 * @param post - How an answer is posted back.
 * @param onLost - Told why a stream ended.
 * @param wait - How to pause before reopening.
 * @param retryMs - How long to pause.
 * @param keepGoing - Whether to carry on, so shutting down ends the loop.
 */
const relayPluginCalls = async ({
  stream,
  answer,
  post,
  onLost,
  wait,
  retryMs,
  keepGoing,
}: RelayPluginCallsOptions): Promise<void> => {
  while (keepGoing()) {
    const reason = await stream((call) => {
      void answer(call)
        .then((answered) => post(call.id, answered))
        .catch(() => null);
    }, new AbortController().signal);

    onLost(reason);

    if (keepGoing()) {
      await wait(retryMs);
    }
  }
};

export { relayPluginCalls };
