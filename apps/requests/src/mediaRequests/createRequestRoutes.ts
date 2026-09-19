import { Hono } from 'hono';
import {
  MediaRequestArrivalSchema,
  MediaRequestDraftSchema,
  MediaRequestPickSchema,
  MediaRequestRefusalSchema,
  MediaRequestRevisionSchema,
  RequestCatalogueUpdateSchema,
} from '@ValenceContracts/schemas/MediaRequest';
import { readBody } from '@ValenceRequests/readBody';
import type { MediaRequestAdded } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestService } from '@ValenceRequests/mediaRequests/createRequestService';
import type { RequestWorker } from '@ValenceRequests/mediaRequests/createRequestWorker';
import type { RequestLogStore } from '@ValenceRequests/mediaRequests/RequestLogStore';

type CreateRequestRoutesOptions = {
  service: RequestService;
  log: Pick<RequestLogStore, 'list'>;
  worker: Pick<RequestWorker, 'searchMissing' | 'releasesFor' | 'pick'>;
};

const NO_SUCH_REQUEST = { error: 'No such request.' };

/**
 * Requests for films and series, as routes under `/api`: making and listing them, approving and
 * refusing them, changing what they ask for, keeping them up to date with the catalogue, trying
 * again, searching by hand and picking a release, searching for everything still missing, and
 * reading what each has done.
 *
 * @param service - The requests.
 * @param log - What each request has done.
 * @param worker - What fetches them.
 * @returns The routes.
 */
const createRequestRoutes = ({ service, log, worker }: CreateRequestRoutesOptions) => {
  const routes = new Hono();

  const answer = <Shown>(shown: Shown | null) =>
    shown === null ? Response.json(NO_SUCH_REQUEST, { status: 404 }) : Response.json(shown);

  routes.get('/requests', async (context) => context.json(await service.list()));

  routes.post('/requests', async (context) => {
    const draft = await readBody(context.req.raw, MediaRequestDraftSchema);

    if (draft === null) {
      return context.json({ error: 'That is not a request.' }, 400);
    }

    const added: MediaRequestAdded = await service.add(draft);

    return context.json(added, added.isNew ? 201 : 200);
  });

  routes.get('/requests/following', async (context) => context.json(await service.following()));

  routes.post('/requests/missing', async (context) => context.json(await worker.searchMissing()));

  routes.get('/requests/:id', async (context) =>
    answer(await service.find(context.req.param('id'))),
  );

  routes.patch('/requests/:id', async (context) => {
    const revision = await readBody(context.req.raw, MediaRequestRevisionSchema);

    return revision === null
      ? context.json({ error: 'That is not a change to a request.' }, 400)
      : answer(await service.change(context.req.param('id'), revision.change, revision.catalogue));
  });

  routes.delete('/requests/:id', async (context) =>
    (await service.remove(context.req.param('id')))
      ? context.body(null, 204)
      : context.json(NO_SUCH_REQUEST, 404),
  );

  routes.post('/requests/:id/approve', async (context) =>
    answer(await service.approve(context.req.param('id'))),
  );

  routes.post('/requests/:id/refuse', async (context) => {
    const refusal = await readBody(context.req.raw, MediaRequestRefusalSchema);

    return refusal === null
      ? context.json({ error: 'Say why it was refused, or nothing.' }, 400)
      : answer(await service.refuse(context.req.param('id'), refusal.reason));
  });

  routes.post('/requests/:id/retry', async (context) =>
    answer(await service.retry(context.req.param('id'))),
  );

  routes.post('/requests/:id/arrived', async (context) => {
    const arrival = await readBody(context.req.raw, MediaRequestArrivalSchema);

    return arrival === null
      ? context.json({ error: 'Say which item it became.' }, 400)
      : answer(await service.arrived(context.req.param('id'), arrival.mediaId));
  });

  routes.put('/requests/:id/catalogue', async (context) => {
    const update = await readBody(context.req.raw, RequestCatalogueUpdateSchema);

    return update === null
      ? context.json({ error: 'That is not what the catalogue says.' }, 400)
      : answer(await service.updateCatalogue(context.req.param('id'), update));
  });

  routes.get('/requests/:id/log', async (context) => {
    const id = context.req.param('id');

    return (await service.find(id)) === null
      ? context.json(NO_SUCH_REQUEST, 404)
      : context.json(await log.list(id));
  });

  routes.get('/requests/:id/releases', async (context) =>
    answer(await worker.releasesFor(context.req.param('id'))),
  );

  routes.post('/requests/:id/pick', async (context) => {
    const pick = await readBody(context.req.raw, MediaRequestPickSchema);

    if (pick === null) {
      return context.json({ error: 'Say which release to fetch.' }, 400);
    }

    const picked = await worker.pick(context.req.param('id'), pick.release);

    return typeof picked === 'string' ? context.json({ error: picked }, 400) : answer(picked);
  });

  return routes;
};

export { createRequestRoutes };
