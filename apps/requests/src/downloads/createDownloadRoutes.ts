import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  DownloadClientChangeSchema,
  DownloadClientDraftSchema,
} from '@ValenceContracts/schemas/DownloadClient';
import {
  DownloadEventAckSchema,
  DownloadWatchSchema,
  ReleaseSendSchema,
} from '@ValenceContracts/schemas/DownloadQueue';
import { readBody } from '@ValenceRequests/readBody';
import type { DownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import type { DownloadQueueService } from '@ValenceRequests/downloads/createDownloadQueue';

type CreateDownloadRoutesOptions = {
  clients: Pick<DownloadClientService, 'list' | 'add' | 'change' | 'remove' | 'test' | 'tryDraft'>;
  queue: Pick<
    DownloadQueueService,
    'queue' | 'send' | 'pause' | 'resume' | 'remove' | 'watch' | 'listen' | 'acknowledge'
  >;
  keepAliveMs?: number;
};

const NO_SUCH_CLIENT = { error: 'No such download client.' };

const NO_SUCH_DOWNLOAD = { error: 'No such download.' };

const NOT_A_CLIENT = { error: 'That is not a download client.' };

const KEEP_ALIVE_MS = 15_000;

/**
 * The download clients and the queue, as routes under `/api`: keeping and trying clients, sending
 * releases, acting on what was sent, and one stream that carries the queue to the server as it
 * changes, with the events it has still to hear.
 *
 * The stream says nothing of its own between rounds but a comment now and then, so a proxy between
 * the two does not take it for idle and close it.
 *
 * @param clients - The download clients.
 * @param queue - The queue.
 * @param keepAliveMs - How long the stream may be quiet before it says something.
 * @returns The routes.
 */
const createDownloadRoutes = ({
  clients,
  queue,
  keepAliveMs = KEEP_ALIVE_MS,
}: CreateDownloadRoutesOptions) => {
  const routes = new Hono();

  routes.get('/clients', async (context) => context.json(await clients.list()));

  routes.post('/clients', async (context) => {
    const draft = await readBody(context.req.raw, DownloadClientDraftSchema);

    return draft === null
      ? context.json(NOT_A_CLIENT, 400)
      : context.json(await clients.add(draft), 201);
  });

  routes.post('/clients/try', async (context) => {
    const draft = await readBody(context.req.raw, DownloadClientDraftSchema);

    return draft === null
      ? context.json(NOT_A_CLIENT, 400)
      : context.json(await clients.tryDraft(draft));
  });

  routes.patch('/clients/:id', async (context) => {
    const change = await readBody(context.req.raw, DownloadClientChangeSchema);

    if (change === null) {
      return context.json({ error: 'That is not a change to a download client.' }, 400);
    }

    const changed = await clients.change(context.req.param('id'), change);

    return changed === null ? context.json(NO_SUCH_CLIENT, 404) : context.json(changed);
  });

  routes.delete('/clients/:id', async (context) =>
    (await clients.remove(context.req.param('id')))
      ? context.body(null, 204)
      : context.json(NO_SUCH_CLIENT, 404),
  );

  routes.post('/clients/:id/test', async (context) => {
    const tested = await clients.test(context.req.param('id'));

    return tested === null ? context.json(NO_SUCH_CLIENT, 404) : context.json(tested);
  });

  routes.post('/clients/:id/try', async (context) => {
    const draft = await readBody(context.req.raw, DownloadClientDraftSchema);

    return draft === null
      ? context.json(NOT_A_CLIENT, 400)
      : context.json(await clients.tryDraft(draft, context.req.param('id')));
  });

  routes.get('/downloads', async (context) => context.json(await queue.queue()));

  routes.post('/downloads', async (context) => {
    const release = await readBody(context.req.raw, ReleaseSendSchema);

    if (release === null) {
      return context.json({ error: 'That is not a release to send.' }, 400);
    }

    const sent = await queue.send(release);

    return typeof sent === 'string' ? context.json({ error: sent }, 400) : context.json(sent, 201);
  });

  routes.get('/downloads/stream', (context) =>
    streamSSE(context, async (stream) => {
      const stop = queue.listen((frame) => {
        void stream.writeSSE({ data: JSON.stringify(frame) });
      });

      stream.onAbort(stop);

      while (!stream.aborted) {
        await stream.sleep(keepAliveMs);
        await stream.write(': still here\n\n');
      }
    }),
  );

  routes.post('/downloads/watch', async (context) => {
    const asked = await readBody(context.req.raw, DownloadWatchSchema);

    if (asked === null) {
      return context.json({ error: 'Say whether anybody is watching.' }, 400);
    }

    queue.watch(asked.isWatching);

    return context.body(null, 204);
  });

  routes.post('/downloads/events/ack', async (context) => {
    const asked = await readBody(context.req.raw, DownloadEventAckSchema);

    if (asked === null) {
      return context.json({ error: 'Say which events were heard.' }, 400);
    }

    await queue.acknowledge(asked.ids);

    return context.body(null, 204);
  });

  for (const action of ['pause', 'resume'] as const) {
    routes.post(`/downloads/:id/${action}`, async (context) => {
      const done = await queue[action](context.req.param('id'));

      if (done === null) {
        return context.json(NO_SUCH_DOWNLOAD, 404);
      }

      return typeof done === 'string' ? context.json({ error: done }, 400) : context.json(done);
    });
  }

  routes.delete('/downloads/:id', async (context) => {
    const removed = await queue.remove(
      context.req.param('id'),
      context.req.query('deleteData') === 'true',
    );

    if (typeof removed === 'string') {
      return context.json({ error: removed }, 400);
    }

    return removed ? context.body(null, 204) : context.json(NO_SUCH_DOWNLOAD, 404);
  });

  return routes;
};

export { createDownloadRoutes };
