import { Hono } from 'hono';
import { ArrAppChangeSchema, ArrAppDraftSchema } from '@ValenceContracts/schemas/ArrApp';
import { readBody } from '@ValenceRequests/readBody';
import type { ArrAppService } from '@ValenceRequests/arrApps/createArrAppService';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';

type CreateArrAppRoutesOptions = {
  apps: Pick<
    ArrAppService,
    | 'list'
    | 'add'
    | 'change'
    | 'remove'
    | 'test'
    | 'tryDraft'
    | 'choices'
    | 'queue'
    | 'importIndexers'
  >;
};

const NO_SUCH_APP = refuse('error.arrApps.noSuchConnectedApp');

const NOT_AN_APP = refuse('error.arrApps.thatIsNotAConnectedApp');

/**
 * The connected Radarr, Sonarr, Lidarr and Prowlarr apps, as routes under `/api`: keeping and
 * trying them, the root folders and profiles a library handed to one may choose from, everything in
 * their queues, and bringing Prowlarr's indexers in.
 *
 * @param apps - The connected apps.
 * @returns The routes.
 */
const createArrAppRoutes = ({ apps }: CreateArrAppRoutesOptions) => {
  const routes = new Hono();

  routes.get('/arr-apps', async (context) => context.json(await apps.list()));

  routes.get('/arr-apps/queue', async (context) => context.json(await apps.queue()));

  routes.post('/arr-apps', async (context) => {
    const draft = await readBody(context.req.raw, ArrAppDraftSchema);

    return draft === null
      ? context.json(NOT_AN_APP, 400)
      : context.json(await apps.add(draft), 201);
  });

  routes.post('/arr-apps/try', async (context) => {
    const draft = await readBody(context.req.raw, ArrAppDraftSchema);

    return draft === null
      ? context.json(NOT_AN_APP, 400)
      : context.json(await apps.tryDraft(draft));
  });

  routes.patch('/arr-apps/:id', async (context) => {
    const change = await readBody(context.req.raw, ArrAppChangeSchema);

    if (change === null) {
      return context.json(refuse('error.arrApps.thatIsNotAChangeToAConnectedApp'), 400);
    }

    const changed = await apps.change(context.req.param('id'), change);

    return changed === null ? context.json(NO_SUCH_APP, 404) : context.json(changed);
  });

  routes.delete('/arr-apps/:id', async (context) =>
    (await apps.remove(context.req.param('id')))
      ? context.body(null, 204)
      : context.json(NO_SUCH_APP, 404),
  );

  routes.post('/arr-apps/:id/test', async (context) => {
    const tested = await apps.test(context.req.param('id'));

    return tested === null ? context.json(NO_SUCH_APP, 404) : context.json(tested);
  });

  routes.post('/arr-apps/:id/try', async (context) => {
    const draft = await readBody(context.req.raw, ArrAppDraftSchema);

    return draft === null
      ? context.json(NOT_AN_APP, 400)
      : context.json(await apps.tryDraft(draft, context.req.param('id')));
  });

  routes.get('/arr-apps/:id/choices', async (context) => {
    const choices = await apps.choices(context.req.param('id'));

    if (choices === null) {
      return context.json(NO_SUCH_APP, 404);
    }

    return 'refused' in choices
      ? context.json(refuseWith(choices.refused), 400)
      : context.json(choices);
  });

  routes.post('/arr-apps/:id/import-indexers', async (context) => {
    const imported = await apps.importIndexers(context.req.param('id'));

    if (imported === null) {
      return context.json(NO_SUCH_APP, 404);
    }

    return 'refused' in imported
      ? context.json(refuseWith(imported.refused), 400)
      : context.json(imported);
  });

  return routes;
};

export { createArrAppRoutes };
