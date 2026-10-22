import { SETTINGS_FOLD_WITHIN_MS } from '@ValenceServer/audit/SETTINGS_FOLD_WITHIN_MS';
import type { RecordAudit } from '@ValenceServer/audit/RecordAudit';
import {
  readPreTranscodingRoute,
  runPreTranscodingRoute,
  savePreTranscodingRoute,
} from '@ValenceServer/routes/PreTranscodingRoute';
import { refuse } from '@ValenceI18n/refuse';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { PreTranscodingService } from './PreTranscodingService';

const MAY_NOT = refuse('common.thatIsForAdministrators');

type PreTranscodingRouteOptions = {
  recordAudit?: RecordAudit;
  preTranscoding: PreTranscodingService;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
  accountOf: (headers: Headers) => Promise<string | null>;
};

/**
 * Puts pre-transcoding on the API, behind the same permission as re-encoding, since every copy it
 * makes is a re-encode kept alongside.
 *
 * @param app - The application to register on.
 * @param options - The service, how to check a permission, and who is asking.
 */
const registerPreTranscodingRoutes = (
  app: OpenAPIHono,
  { preTranscoding, requires, accountOf, recordAudit }: PreTranscodingRouteOptions,
): void => {
  app.openapi(readPreTranscodingRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json(await preTranscoding.status(), 200);
  });

  app.openapi(savePreTranscodingRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const saved = await preTranscoding.save(context.req.valid('json'));

    await recordAudit?.(
      context,
      'settings.changed',
      null,
      { settings: 'preTranscoding' },
      {
        foldWithinMs: SETTINGS_FOLD_WITHIN_MS,
      },
    );

    return context.json(saved, 200);
  });

  app.openapi(runPreTranscodingRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const askedBy = await accountOf(context.req.raw.headers);

    return context.json(
      { queued: askedBy !== null && (await preTranscoding.runNow(askedBy)) },
      202,
    );
  });
};

export type { PreTranscodingRouteOptions };

export { registerPreTranscodingRoutes };
