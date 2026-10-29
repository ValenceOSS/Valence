import { SETTINGS_FOLD_WITHIN_MS } from '@ValenceServer/audit/SETTINGS_FOLD_WITHIN_MS';
import type { RecordAudit } from '@ValenceServer/audit/RecordAudit';
import { telemetryPreviewRoute, telemetryResetIdRoute } from '@ValenceServer/routes/TelemetryRoute';
import { refuse } from '@ValenceI18n/refuse';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { TelemetryService } from './TelemetryService';

const MAY_NOT = refuse('common.thatIsForAdministrators');

type TelemetryRouteOptions = {
  telemetry: TelemetryService;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
  recordAudit?: RecordAudit;
};

/**
 * Puts the anonymous statistics on the API for administrators who may change the server's
 * settings: the exact report it would send, and making a new install id.
 *
 * @param app - The application to register on.
 * @param options - The telemetry service, how to check a permission, and the audit log.
 */
const registerTelemetryRoutes = (
  app: OpenAPIHono,
  { telemetry, requires, recordAudit }: TelemetryRouteOptions,
): void => {
  app.openapi(telemetryPreviewRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json(await telemetry.preview(), 200);
  });

  app.openapi(telemetryResetIdRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(MAY_NOT, 403);
    }

    const installId = await telemetry.resetInstallId();

    await recordAudit?.(
      context,
      'settings.changed',
      null,
      { settings: 'telemetryInstallId' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ installId }, 200);
  });
};

export { registerTelemetryRoutes };
