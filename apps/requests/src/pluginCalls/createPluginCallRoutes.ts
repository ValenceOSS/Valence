import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { PluginCallAnswerSchema } from '@ValenceContracts/schemas/PluginCall';
import { refuse } from '@ValenceI18n/refuse';
import { readBody } from '@ValenceRequests/readBody';
import type { PluginCallChannel } from './createPluginCallChannel';

type CreatePluginCallRoutesOptions = {
  channel: Pick<PluginCallChannel, 'listen' | 'answer'>;
  keepAliveMs?: number;
};

const KEEP_ALIVE_MS = 15_000;

/**
 * The routes the Valence server answers plugin calls through: one stream carrying each call down
 * to it, and one address it posts each answer to.
 *
 * @param channel - Where calls wait for their answers.
 * @param keepAliveMs - How long the stream may be quiet before it says something.
 * @returns The routes.
 */
const createPluginCallRoutes = ({
  channel,
  keepAliveMs = KEEP_ALIVE_MS,
}: CreatePluginCallRoutesOptions) => {
  const routes = new Hono();

  routes.get('/plugin-calls/stream', (context) =>
    streamSSE(context, async (stream) => {
      const stop = channel.listen((call) => {
        void stream.writeSSE({ data: JSON.stringify(call) });
      });

      stream.onAbort(stop);

      while (!stream.aborted) {
        await stream.sleep(keepAliveMs);
        await stream.write(': still here\n\n');
      }
    }),
  );

  routes.post('/plugin-calls/:id', async (context) => {
    const answer = await readBody(context.req.raw, PluginCallAnswerSchema);

    if (answer === null) {
      return context.json(refuse('error.pluginCalls.thatIsNotAnAnswerTo'), 400);
    }

    return channel.answer(context.req.param('id'), answer)
      ? context.body(null, 204)
      : context.json(refuse('error.pluginCalls.noCallIsWaitingFor'), 404);
  });

  return routes;
};

export { createPluginCallRoutes };
