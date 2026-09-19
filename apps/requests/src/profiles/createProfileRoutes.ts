import { Hono } from 'hono';
import {
  QualityProfileChangeSchema,
  QualityProfileDraftSchema,
} from '@ValenceContracts/schemas/QualityProfile';
import { readBody } from '@ValenceRequests/readBody';
import type { ProfileService } from '@ValenceRequests/profiles/createProfileService';

const NO_SUCH_PROFILE = { error: 'No such profile.' };

/**
 * The quality profiles, as routes under `/api`: listing, adding, changing and removing them.
 *
 * @param profiles - The profiles.
 * @returns The routes.
 */
const createProfileRoutes = (profiles: ProfileService) => {
  const routes = new Hono();

  routes.get('/profiles', async (context) => context.json(await profiles.list()));

  routes.post('/profiles', async (context) => {
    const draft = await readBody(context.req.raw, QualityProfileDraftSchema);

    return draft === null
      ? context.json({ error: 'That is not a profile.' }, 400)
      : context.json(await profiles.add(draft), 201);
  });

  routes.patch('/profiles/:id', async (context) => {
    const change = await readBody(context.req.raw, QualityProfileChangeSchema);

    if (change === null) {
      return context.json({ error: 'That is not a change to a profile.' }, 400);
    }

    const changed = await profiles.change(context.req.param('id'), change);

    return changed === null ? context.json(NO_SUCH_PROFILE, 404) : context.json(changed);
  });

  routes.delete('/profiles/:id', async (context) =>
    (await profiles.remove(context.req.param('id')))
      ? context.body(null, 204)
      : context.json(NO_SUCH_PROFILE, 404),
  );

  return routes;
};

export { createProfileRoutes };
