import { Hono } from 'hono';
import {
  DownloadStopSchema,
  MediaRequestFollowSchema,
  MediaRequestArrivalSchema,
  MediaRequestDepartureSchema,
  MediaRequestArrivalsSchema,
  MediaRequestDraftSchema,
  MediaRequestPickSchema,
  MediaRequestRefusalSchema,
  MediaRequestRevisionSchema,
  RequestCatalogueUpdateSchema,
  RequesterSchema,
} from '@ValenceContracts/schemas/MediaRequest';
import { readBody } from '@ValenceRequests/readBody';
import type { MediaRequestAdded } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestService } from '@ValenceRequests/mediaRequests/createRequestService';
import type { RequestWorker } from '@ValenceRequests/mediaRequests/createRequestWorker';
import type { RequestLogStore } from '@ValenceRequests/mediaRequests/RequestLogStore';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';

type CreateRequestRoutesOptions = {
  service: RequestService;
  log: Pick<RequestLogStore, 'list'>;
  worker: Pick<
    RequestWorker,
    | 'searchMissing'
    | 'releasesFor'
    | 'releasesForDraft'
    | 'pick'
    | 'dropDownloads'
    | 'unfinishedDownloadsOf'
    | 'stopDownload'
    | 'deleteFiled'
    | 'blockedFor'
    | 'unblock'
  >;
};

const NO_SUCH_REQUEST = refuse('error.requests.noSuchRequest');

/**
 * Requests for films and series, as routes under `/api`: making and listing them, approving and
 * refusing them, adding somebody else who wants one and taking away one who no longer does,
 * changing what they ask for, keeping them up to date with the catalogue, trying again, searching
 * by hand and picking a release — for a request not yet made, too — searching for everything still
 * missing, reading what each has done, and lifting a release it will not try again, stopping one of
 * its downloads, following or not following its episodes, and deleting the files it filed. A
 * request cancelled can take the downloads it had not yet finished filing with it, files and all,
 * and a request refused takes them always.
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

  /**
   * Stops downloads once whatever the worker is doing has finished, without waiting for it, so
   * a long search never holds up whoever asked.
   *
   * @param downloadIds - The downloads.
   */
  const dropLater = (downloadIds: readonly string[]) => {
    if (downloadIds.length > 0) {
      void worker.dropDownloads(downloadIds).catch(() => 0);
    }
  };

  /**
   * Refuses a request, stopping whatever it was already downloading, files and all, so a refusal
   * after approval leaves nothing running. It answers at once, and the downloads stop once the
   * worker is free.
   *
   * @param id - The request.
   * @param reason - Why, for whoever asked.
   * @returns The request, or nothing where there is no such request.
   */
  const refuseAndStop = async (id: string, reason: string) => {
    const unfinished = await worker.unfinishedDownloadsOf(id);
    const refused = await service.refuse(id, reason);

    if (refused !== null) {
      dropLater(unfinished);
    }

    return refused;
  };

  routes.get('/requests', async (context) => context.json(await service.list()));

  routes.post('/requests', async (context) => {
    const draft = await readBody(context.req.raw, MediaRequestDraftSchema);

    if (draft === null) {
      return context.json(refuse('error.requests.thatIsNotARequest'), 400);
    }

    const added: MediaRequestAdded = await service.add(draft);

    return context.json(added, added.isNew ? 201 : 200);
  });

  routes.post('/requests/releases', async (context) => {
    const draft = await readBody(context.req.raw, MediaRequestDraftSchema);

    return draft === null
      ? context.json(refuse('error.requests.thatIsNotARequest'), 400)
      : context.json(await worker.releasesForDraft(draft));
  });

  routes.get('/requests/following', async (context) => context.json(await service.following()));

  routes.post('/requests/missing', async (context) => context.json(await worker.searchMissing()));

  routes.get('/requests/:id', async (context) =>
    answer(await service.find(context.req.param('id'))),
  );

  routes.patch('/requests/:id', async (context) => {
    const revision = await readBody(context.req.raw, MediaRequestRevisionSchema);

    return revision === null
      ? context.json(refuse('error.requests.thatIsNotAChangeTo'), 400)
      : answer(
          await service.change(
            context.req.param('id'),
            revision.change,
            revision.catalogue,
            revision.held,
          ),
        );
  });

  routes.delete('/requests/:id', async (context) => {
    const id = context.req.param('id');
    const unfinished =
      context.req.query('deleteDownloads') === 'true' ? await worker.unfinishedDownloadsOf(id) : [];

    if (!(await service.remove(id))) {
      return context.json(NO_SUCH_REQUEST, 404);
    }

    dropLater(unfinished);

    return context.body(null, 204);
  });

  routes.post('/requests/:id/askers', async (context) => {
    const asker = await readBody(context.req.raw, RequesterSchema);

    return asker === null
      ? context.json(refuse('error.requests.sayWhoIsAsking'), 400)
      : answer(await service.join(context.req.param('id'), asker));
  });

  routes.delete('/requests/:id/askers/:askerId', async (context) =>
    answer(await service.leave(context.req.param('id'), context.req.param('askerId'))),
  );

  routes.post('/requests/:id/approve', async (context) =>
    answer(await service.approve(context.req.param('id'))),
  );

  routes.post('/requests/:id/refuse', async (context) => {
    const refusal = await readBody(context.req.raw, MediaRequestRefusalSchema);

    return refusal === null
      ? context.json(refuse('error.requests.sayWhyItWasRefusedOr'), 400)
      : answer(await refuseAndStop(context.req.param('id'), refusal.reason));
  });

  routes.post('/requests/:id/downloads/:downloadId/stop', async (context) => {
    const stopping = await readBody(context.req.raw, DownloadStopSchema);

    return stopping === null
      ? context.json(refuse('error.requests.sayWhatHappensAfterTheDownload'), 400)
      : answer(
          await worker.stopDownload(
            context.req.param('id'),
            context.req.param('downloadId'),
            stopping,
          ),
        );
  });

  routes.post('/requests/:id/follow', async (context) => {
    const following = await readBody(context.req.raw, MediaRequestFollowSchema);

    return following === null
      ? context.json(refuse('error.requests.sayWhatToFollow'), 400)
      : answer(await service.follow(context.req.param('id'), following));
  });

  routes.post('/requests/:id/files/delete', async (context) => {
    const id = context.req.param('id');

    return (await service.find(id)) === null
      ? context.json(NO_SUCH_REQUEST, 404)
      : context.json({ folders: await worker.deleteFiled(id) });
  });

  routes.post('/requests/:id/retry', async (context) =>
    answer(await service.retry(context.req.param('id'))),
  );

  routes.post('/requests/:id/fulfil', async (context) =>
    answer(await service.fulfil(context.req.param('id'))),
  );

  routes.post('/requests/:id/arrived', async (context) => {
    const arrival = await readBody(context.req.raw, MediaRequestArrivalSchema);

    return arrival === null
      ? context.json(refuse('error.requests.sayWhichItemItBecame'), 400)
      : answer(await service.arrived(context.req.param('id'), arrival.mediaId));
  });

  routes.post('/requests/:id/left', async (context) => {
    const departure = await readBody(context.req.raw, MediaRequestDepartureSchema);

    return departure === null
      ? context.json(refuse('error.requests.sayWhichItemItBecame'), 400)
      : answer(await service.left(context.req.param('id'), departure.mediaId));
  });

  routes.post('/requests/:id/arrivals', async (context) => {
    const arrivals = await readBody(context.req.raw, MediaRequestArrivalsSchema);

    return arrivals === null
      ? context.json(refuse('error.requests.sayWhichItemItBecame'), 400)
      : answer(await service.arrivedInLibrary(context.req.param('id'), arrivals));
  });

  routes.put('/requests/:id/catalogue', async (context) => {
    const update = await readBody(context.req.raw, RequestCatalogueUpdateSchema);

    return update === null
      ? context.json(refuse('error.requests.thatIsNotWhatTheCatalogue'), 400)
      : answer(await service.updateCatalogue(context.req.param('id'), update));
  });

  routes.get('/requests/:id/blocklist', async (context) => {
    const id = context.req.param('id');

    return (await service.find(id)) === null
      ? context.json(NO_SUCH_REQUEST, 404)
      : context.json(await worker.blockedFor(id));
  });

  routes.delete('/requests/:id/blocklist/:blockId', async (context) =>
    (await worker.unblock(context.req.param('blockId')))
      ? context.body(null, 204)
      : context.json(refuse('error.requests.noSuchBlockedRelease'), 404),
  );

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
      return context.json(refuse('error.common.sayWhichReleaseToFetch'), 400);
    }

    const picked = await worker.pick(context.req.param('id'), pick.release);

    return picked !== null && 'refused' in picked
      ? context.json(refuseWith(picked.refused), 400)
      : answer(picked);
  });

  return routes;
};

export { createRequestRoutes };
