import { listAuditRoute } from '@ValenceServer/routes/AuditRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the audit log's endpoint, for anybody allowed to read the server's logs.
 *
 * @param app - The application to register it on.
 * @param context - What it is answered with.
 */
const serveAudit = (app: OpenAPIHono, context: AppContext): void => {
  const { requires, audit } = context;

  app.openapi(listAuditRoute, async (asked) => {
    if (!(await requires(asked.req.raw.headers, 'server.logs'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return asked.json(await audit.list(asked.req.valid('query')), 200);
  });
};

export { serveAudit };
