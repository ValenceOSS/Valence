import { apiReference } from '@scalar/hono-api-reference';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the API's own description, and the reference page drawn from it.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveReference = (app: OpenAPIHono, context: AppContext): void => {
  const { SERVER_VERSION } = context;

  app.doc('/api/openapi.json', {
    openapi: '3.1.0',
    info: {
      // eslint-disable-next-line valence/no-hard-coded-strings -- the OpenAPI document, which the rule skips in *Route.ts
      title: 'Valence API',
      version: SERVER_VERSION,
      // eslint-disable-next-line valence/no-hard-coded-strings -- the OpenAPI document, which the rule skips in *Route.ts
      description: 'Self-hosted streaming platform API.',
    },
  });

  app.get(
    '/api/reference',
    // eslint-disable-next-line valence/no-hard-coded-strings -- the OpenAPI document, which the rule skips in *Route.ts
    apiReference({ spec: { url: '/api/openapi.json' }, pageTitle: 'Valence API' }),
  );
};

export { serveReference };
