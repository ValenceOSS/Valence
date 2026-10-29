import { createRoute } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  TelemetryInstallIdSchema,
  TelemetryPreviewSchema,
} from '@ValenceContracts/schemas/TelemetryPreview';

const TelemetryError = RefusalSchema.openapi('TelemetryError');

const Preview = TelemetryPreviewSchema.openapi('TelemetryPreview');

const InstallId = TelemetryInstallIdSchema.openapi('TelemetryInstallId');

const refused = {
  403: {
    description: 'Anonymous statistics are for administrators who may change the server settings',
    content: { 'application/json': { schema: TelemetryError } },
  },
};

const telemetryPreviewRoute = createRoute({
  method: 'get',
  path: '/api/admin/telemetry/preview',
  tags: ['Admin'],
  summary: 'Read the exact anonymous report this server would send, and whether it is sending',
  responses: {
    200: {
      description:
        'The report as it would be sent, where it goes, and what holds it back if anything does',
      content: { 'application/json': { schema: Preview } },
    },
    ...refused,
  },
});

const telemetryResetIdRoute = createRoute({
  method: 'post',
  path: '/api/admin/telemetry/reset-id',
  tags: ['Admin'],
  summary: 'Make a new random install id, so later reports cannot be tied to earlier ones',
  responses: {
    200: {
      description: 'The new install id',
      content: { 'application/json': { schema: InstallId } },
    },
    ...refused,
  },
});

export { telemetryPreviewRoute, telemetryResetIdRoute };
