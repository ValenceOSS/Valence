import type { Hono } from 'hono';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Answers any API address no route claimed with a refusal that says the server doesn't have it, so a
 * client newer than this server can tell a missing feature from a missing item. Register it after
 * every other API route, because it claims everything under `/api` that reaches it.
 *
 * @param app - The application to register it on.
 */
const refuseUnknownAddresses = (app: Pick<Hono, 'all'>): void => {
  app.all('/api/*', (context) =>
    context.json(refuse('error.common.thisServerDoesNotHaveThatAddress'), 404),
  );
};

export { refuseUnknownAddresses };
