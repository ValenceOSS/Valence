import { say } from '@ValenceI18n/say';
import {
  listProfilesRoute,
  createProfileRoute,
  updateProfileRoute,
  deleteProfileRoute,
  promoteProfileRoute,
} from '@ValenceServer/routes/ProfileRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the profile endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveProfile = (app: OpenAPIHono, context: AppContext): void => {
  const { profiles, promoteProfile, requires, announceProfiles, readAccount } = context;

  app.openapi(listProfilesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await profiles.ensureDefault(account.id, account.name);

    return context.json({ profiles: await profiles.list(account.id) }, 200);
  });

  app.openapi(createProfileRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { name, colour, avatar } = context.req.valid('json');

    try {
      const created = await profiles.create(account.id, {
        name,
        colour,
        ...(avatar === undefined ? {} : { avatar }),
      });

      await announceProfiles(account.id);

      return context.json(created, 201);
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : say('server.errors.profileNotAdded') },
        409,
      );
    }
  });

  app.openapi(updateProfileRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { name, colour, avatar, askStillWatchingAfter, showsWhatIamWatching } =
      context.req.valid('json');

    const changed = await profiles.rename(account.id, context.req.valid('param').profileId, {
      name,
      colour,
      ...(avatar === undefined ? {} : { avatar }),
      ...(askStillWatchingAfter === undefined ? {} : { askStillWatchingAfter }),
      ...(showsWhatIamWatching === undefined ? {} : { showsWhatIamWatching }),
    });

    if (changed) {
      await announceProfiles(account.id);
    }

    return changed
      ? context.body(null, 204)
      : context.json({ error: say('server.errors.noSuchProfileOnAccount') }, 404);
  });

  app.openapi(deleteProfileRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const removed = await profiles.remove(account.id, context.req.valid('param').profileId);

    if (removed) {
      await announceProfiles(account.id);
    }

    return removed
      ? context.body(null, 204)
      : context.json({ error: say('server.errors.noSuchProfileOrLast') }, 404);
  });

  app.openapi(promoteProfileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (profiles === undefined || promoteProfile === undefined) {
      return context.json({ error: say('server.errors.noSuchProfile') }, 404);
    }

    const { profileId } = context.req.valid('param');
    const { email, password } = context.req.valid('json');

    const outcome = await promoteProfile({ profileId, email, password });

    if (outcome.kind === 'taken') {
      return context.json({ error: say('server.errors.addressHasAccount') }, 409);
    }

    if (outcome.kind === 'missing') {
      return context.json({ error: say('server.errors.noSuchProfile') }, 404);
    }

    return context.json(outcome.profile, 200);
  });
};

export { serveProfile };
