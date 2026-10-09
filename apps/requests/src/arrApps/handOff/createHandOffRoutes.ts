import { Hono } from 'hono';
import {
  DownloadStopSchema,
  MediaRequestFollowSchema,
} from '@ValenceContracts/schemas/MediaRequest';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';
import type {
  HandOffControl,
  HandOffOutcome,
} from '@ValenceRequests/arrApps/handOff/createHandOffControl';
import type { RequestService } from '@ValenceRequests/mediaRequests/createRequestService';
import { readBody } from '@ValenceRequests/readBody';

type CreateHandOffRoutesOptions = {
  service: Pick<RequestService, 'find' | 'follow'>;
  control: HandOffControl;
};

const NOT_HANDED_OFF = refuse('error.requests.noSuchRequest');

/**
 * The routes through which an admin works the connected app a request was handed to: its
 * downloads for the request and stopping one, its blocklist for it and lifting an entry, following
 * or not following some of what it asks for there as well as in Valence, and letting the app stop
 * monitoring it before the request is removed.
 *
 * @param service - The requests.
 * @param control - What works the apps.
 * @returns The routes.
 */
const createHandOffRoutes = ({ service, control }: CreateHandOffRoutesOptions) => {
  const routes = new Hono();

  const refused = (outcome: Exclude<HandOffOutcome<true>, { kind: 'done' }>) =>
    outcome.kind === 'notHandedOff'
      ? Response.json(NOT_HANDED_OFF, { status: 404 })
      : Response.json(refuseWith(outcome.problem), { status: 400 });

  const answer = <Value>(outcome: HandOffOutcome<Value>, shown: (value: Value) => Response) =>
    outcome.kind === 'done' ? shown(outcome.value) : refused(outcome);

  const answerRequest = async (id: string) => {
    const found = await service.find(id);

    return found === null ? Response.json(NOT_HANDED_OFF, { status: 404 }) : Response.json(found);
  };

  routes.get('/requests/:id/hand-off/downloads', async (context) =>
    answer(await control.downloads(context.req.param('id')), (downloads) =>
      Response.json(downloads),
    ),
  );

  routes.post('/requests/:id/hand-off/downloads/:downloadId/stop', async (context) => {
    const id = context.req.param('id');
    const stopping = await readBody(context.req.raw, DownloadStopSchema);

    if (stopping === null) {
      return context.json(refuse('error.requests.sayWhatHappensAfterTheDownload'), 400);
    }

    const stopped = await control.stop(id, context.req.param('downloadId'), stopping.next);

    if (stopped.kind !== 'done') {
      return refused(stopped);
    }

    if (stopping.next === 'nothing') {
      await service.follow(id, { itemIds: stopped.value, isFollowed: false });
    }

    return answerRequest(id);
  });

  routes.get('/requests/:id/hand-off/blocklist', async (context) =>
    answer(await control.blocklist(context.req.param('id')), (blocked) => Response.json(blocked)),
  );

  routes.delete('/requests/:id/hand-off/blocklist/:blockId', async (context) =>
    answer(
      await control.lift(context.req.param('id'), context.req.param('blockId')),
      () => new Response(null, { status: 204 }),
    ),
  );

  routes.post('/requests/:id/hand-off/follow', async (context) => {
    const id = context.req.param('id');
    const following = await readBody(context.req.raw, MediaRequestFollowSchema);

    if (following === null) {
      return context.json(refuse('error.requests.sayWhatToFollow'), 400);
    }

    const followed = await control.follow(id, following.itemIds, following.isFollowed);

    if (followed.kind !== 'done') {
      return refused(followed);
    }

    await service.follow(id, following);

    return answerRequest(id);
  });

  routes.post('/requests/:id/hand-off/release', async (context) =>
    answer(
      await control.release(context.req.param('id')),
      () => new Response(null, { status: 204 }),
    ),
  );

  return routes;
};

export { createHandOffRoutes };
