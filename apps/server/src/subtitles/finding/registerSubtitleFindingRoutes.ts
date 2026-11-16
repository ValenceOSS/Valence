import { SETTINGS_FOLD_WITHIN_MS } from '@ValenceServer/audit/SETTINGS_FOLD_WITHIN_MS';
import { troubleWatch } from '@ValenceServer/sources/troubleWatch';
import { refuseForTrouble } from '@ValenceServer/sources/refuseForTrouble';
import type { RecordAudit } from '@ValenceServer/audit/RecordAudit';
import {
  fetchSubtitleRoute,
  findSubtitlesRoute,
  readSubtitleFindingRoute,
  readSubtitleSetupRoute,
  saveSubtitleSetupRoute,
} from '@ValenceServer/routes/SubtitleFindingRoute';
import { refuse } from '@ValenceI18n/refuse';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { SubtitleFinder } from './SubtitleFinder';

const MAY_NOT = refuse('common.thatIsForAdministrators');

type SubtitleFindingRouteOptions = {
  recordAudit?: RecordAudit;
  finder: SubtitleFinder;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
  isFromALinkedServer?: (headers: Headers) => boolean;
};

/**
 * Registers the routes that set up where subtitles are found, say whether they can be found for one
 * film or episode, look for them, and fetch the one chosen — the last three for anybody who may
 * find subtitles, or may correct an item, which always let them, and for a linked server's people
 * where this server lets that server find subtitles, which was settled before the request got here.
 *
 * @param app - The application to register them on.
 * @param options - The finder, how to tell what the person asking may do, and whether a request
 *   was passed through from a linked server.
 */
const registerSubtitleFindingRoutes = (
  app: OpenAPIHono,
  { finder, requires, recordAudit, isFromALinkedServer = () => false }: SubtitleFindingRouteOptions,
): void => {
  const mayFind = async (headers: Headers): Promise<boolean> =>
    isFromALinkedServer(headers) ||
    (await requires(headers, 'media.subtitles')) ||
    requires(headers, 'media.override');

  app.openapi(readSubtitleFindingRoute, async (context) => {
    if (!(await mayFind(context.req.raw.headers))) {
      return context.json(MAY_NOT, 403);
    }

    const finding = await finder.finding(context.req.valid('param').id);

    return finding === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(finding, 200);
  });

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

    const saved = await finder.change(context.req.valid('json'));

    await recordAudit?.(
      context,
      'settings.changed',
      null,
      { settings: 'subtitles' },
      {
        foldWithinMs: SETTINGS_FOLD_WITHIN_MS,
      },
    );

    return context.json(saved, 200);
  });

  app.openapi(findSubtitlesRoute, async (context) => {
    if (!(await mayFind(context.req.raw.headers))) {
      return context.json(MAY_NOT, 403);
    }

    const { value: found, trouble } = await troubleWatch.during(() =>
      finder.search(context.req.valid('param').id, context.req.valid('query').language),
    );

    if (found === null) {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    return found.subtitles.length === 0 && trouble !== null
      ? context.json(refuseForTrouble(trouble), 503)
      : context.json(found, 200);
  });

  app.openapi(fetchSubtitleRoute, async (context) => {
    if (!(await mayFind(context.req.raw.headers))) {
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
      case 'notAllowed':
        return context.json(refuse('error.linking.yourServerMayNotFindSubtitlesHere'), 403);
      case 'failed':
        return context.json(refuse('error.subtitles.theSubtitleCouldNotBeKept'), 502);
    }
  });
};

export { registerSubtitleFindingRoutes };
