import {
  fetchSubtitleRoute,
  findSubtitlesRoute,
  readSubtitleSetupRoute,
  saveSubtitleSetupRoute,
} from '@ValenceServer/routes/SubtitleFindingRoute';
import { refuse } from '@ValenceI18n/refuse';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { SubtitleFinder } from './SubtitleFinder';

const MAY_NOT = refuse('common.thatIsForAdministrators');

type SubtitleFindingRouteOptions = {
  finder: SubtitleFinder;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
};

/**
 * Registers the routes that set up where subtitles are found, look for them for one film or
 * episode, and fetch the one chosen.
 *
 * @param app - The application to register them on.
 * @param options - The finder, and how to tell what the person asking may do.
 */
const registerSubtitleFindingRoutes = (
  app: OpenAPIHono,
  { finder, requires }: SubtitleFindingRouteOptions,
): void => {
  app.openapi(readSubtitleSetupRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json(await finder.setup(), 200);
  });

  app.openapi(saveSubtitleSetupRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json(await finder.change(context.req.valid('json')), 200);
  });

  app.openapi(findSubtitlesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(MAY_NOT, 403);
    }

    const found = await finder.search(
      context.req.valid('param').id,
      context.req.valid('query').language,
    );

    return found === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(found, 200);
  });

  app.openapi(fetchSubtitleRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(MAY_NOT, 403);
    }

    const fetched = await finder.fetch(context.req.valid('param').id, context.req.valid('json'));

    switch (fetched.kind) {
      case 'fetched':
        return context.json({ name: fetched.name }, 200);
      case 'absent':
        return context.json(refuse('error.common.noSuchItem'), 404);
      case 'notSetUp':
        return context.json(refuse('error.subtitles.noKeyIsSavedForThatSite'), 400);
      case 'otherEpisode':
        return context.json(refuse('error.subtitles.thatDownloadIsForAnotherEpisode'), 502);
      case 'unavailable':
        return context.json(refuse('error.subtitles.theSiteWouldNotGiveIt'), 502);
      case 'readOnly':
      case 'denied':
        return context.json(refuse('error.subtitles.valenceMayNotWriteBesideIt'), 403);
      case 'failed':
        return context.json(refuse('error.subtitles.theSubtitleCouldNotBeKept'), 502);
    }
  });
};

export { registerSubtitleFindingRoutes };
