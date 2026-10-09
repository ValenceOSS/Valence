import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  DownloadClientChangeSchema,
  DownloadClientDraftSchema,
} from '@ValenceContracts/schemas/DownloadClient';
import {
  DownloadFilingOrderSchema,
  ServiceEventAckSchema,
  DownloadWatchSchema,
  ReleaseSendSchema,
} from '@ValenceContracts/schemas/DownloadQueue';
import { GiveUpRulesSchema } from '@ValenceContracts/schemas/GiveUpRules';
import { readBody } from '@ValenceRequests/readBody';
import type { DownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import type { DownloadQueueService } from '@ValenceRequests/downloads/createDownloadQueue';
import type { GiveUpRuleStore } from '@ValenceRequests/downloads/createDatabaseGiveUpRuleStore';
import type { RequestWorker } from '@ValenceRequests/mediaRequests/createRequestWorker';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';

type CreateDownloadRoutesOptions = {
  filing?: Pick<RequestWorker, 'fileNow' | 'blockDownload'>;
  clients: Pick<DownloadClientService, 'list' | 'add' | 'change' | 'remove' | 'test' | 'tryDraft'>;
  queue: Pick<
    DownloadQueueService,
    'queue' | 'send' | 'pause' | 'resume' | 'remove' | 'watch' | 'listen' | 'acknowledge'
  >;
  rules: GiveUpRuleStore;
  keepAliveMs?: number;
};

const NO_SUCH_CLIENT = refuse('error.downloads.noSuchDownloadClient');

const NO_SUCH_DOWNLOAD = refuse('error.downloads.noSuchDownload');

const NOT_A_CLIENT = refuse('error.downloads.thatIsNotADownloadClient');

const KEEP_ALIVE_MS = 15_000;

/**
 * The download clients and the queue, as routes under `/api`: keeping and trying clients, sending
 * releases, acting on what was sent, and one stream that carries the queue to the server as it
 * changes, with the events it has still to hear.
 *
 * The stream says nothing of its own between rounds but a comment now and then, so a proxy between
 * the two does not take it for idle and close it.
 *
 * @param filing - What files a finished download into a library, and blocks a removed one's
 *   release for the requests it was fetched for, so it is not fetched for them again.
 * @param clients - The download clients.
 * @param queue - The queue.
 * @param rules - When a download is given up on, so the next best release can be tried.
 * @param keepAliveMs - How long the stream may be quiet before it says something.
 * @returns The routes.
 */
const createDownloadRoutes = ({
  filing = { fileNow: () => Promise.resolve(null), blockDownload: () => Promise.resolve(0) },
  clients,
  queue,
  rules,
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
      return context.json(refuse('error.downloads.thatIsNotAChangeTo'), 400);
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

  routes.get('/give-up-rules', async (context) => context.json(await rules.read()));

  routes.put('/give-up-rules', async (context) => {
    const next = await readBody(context.req.raw, GiveUpRulesSchema);

    return next === null
      ? context.json(refuse('error.downloads.thoseAreNotRulesForGiving'), 400)
      : context.json(await rules.write(next));
  });

  routes.get('/downloads', async (context) => context.json(await queue.queue()));

  routes.post('/downloads', async (context) => {
    const release = await readBody(context.req.raw, ReleaseSendSchema);

    if (release === null) {
      return context.json(refuse('error.downloads.thatIsNotAReleaseTo'), 400);
    }

    const sent = await queue.send(release);

    return 'refused' in sent
      ? context.json({ error: sent.refused, problemCode: sent.problemCode }, 400)
      : context.json(sent, 201);
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
      return context.json(refuse('error.downloads.sayWhetherAnybodyIsWatching'), 400);
    }

    queue.watch(asked.isWatching);

    return context.body(null, 204);
  });

  routes.post('/downloads/events/ack', async (context) => {
    const asked = await readBody(context.req.raw, ServiceEventAckSchema);

    if (asked === null) {
      return context.json(refuse('error.downloads.sayWhichEventsWereHeard'), 400);
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

      return 'refused' in done ? context.json(refuseWith(done.refused), 400) : context.json(done);
    });
  }

  routes.post('/downloads/:id/file', async (context) => {
    const order = await readBody(context.req.raw, DownloadFilingOrderSchema);

    if (order === null) {
      return context.json(refuse('error.downloads.sayWhichLibraryToFileIt'), 400);
    }

    const id = context.req.param('id');
    const filed = await filing.fileNow(id, order.library);

    if (filed === 'claimed') {
      return context.json(refuse('error.downloads.itWasFetchedForARequest'), 400);
    }

    const shown =
      filed === null ? undefined : (await queue.queue()).downloads.find((one) => one.id === id);

    return shown === undefined ? context.json(NO_SUCH_DOWNLOAD, 404) : context.json(shown);
  });

  routes.delete('/downloads/:id', async (context) => {
    const id = context.req.param('id');

    await filing.blockDownload(id);

    const removed = await queue.remove(id, context.req.query('deleteData') === 'true');

    if (typeof removed === 'object') {
      return context.json(refuseWith(removed.refused), 400);
    }

    return removed ? context.body(null, 204) : context.json(NO_SUCH_DOWNLOAD, 404);
  });

  return routes;
};

export { createDownloadRoutes };
