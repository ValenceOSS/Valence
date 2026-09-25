import { say } from '@ValenceI18n/say';
import {
  listHiddenRoute,
  hideMediaRoute,
  showMediaRoute,
  hideSeriesRoute,
  showSeriesRoute,
  hideLibraryRoute,
  showLibraryRoute,
} from '@ValenceServer/routes/HiddenRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the hidden endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveHidden = (app: OpenAPIHono, context: AppContext): void => {
  const { library, hiding, viewerOf, readProfileId } = context;

  app.openapi(listHiddenRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ hidden: await hiding.list(profileId) }, 200);
  });

  app.openapi(hideMediaRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { mediaId } = context.req.valid('param');

    if (!(await hiding.hide(profileId, { kind: 'item', subjectId: mediaId }))) {
      return context.json({ error: say('server.errors.noSuchItem') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(showMediaRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await hiding.show(profileId, { kind: 'item', subjectId: context.req.valid('param').mediaId });

    return context.body(null, 204);
  });

  app.openapi(hideSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { seriesId } = context.req.valid('param');

    if (!(await hiding.hide(profileId, { kind: 'series', subjectId: seriesId }))) {
      return context.json({ error: say('server.errors.noSuchProgramme') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(showSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await hiding.show(profileId, {
      kind: 'series',
      subjectId: context.req.valid('param').seriesId,
    });

    return context.body(null, 204);
  });

  app.openapi(hideLibraryRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null || viewer.kind !== 'account' || viewer.profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { libraryId } = context.req.valid('param');

    const refused = await library.isLibraryOutOfReach(viewer.accountId, libraryId);

    if (refused && !viewer.isAdministrator) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    if (!(await hiding.hide(viewer.profileId, { kind: 'library', subjectId: libraryId }))) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(showLibraryRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await hiding.show(profileId, {
      kind: 'library',
      subjectId: context.req.valid('param').libraryId,
    });

    return context.body(null, 204);
  });
};

export { serveHidden };
