/* oxlint-disable valence/no-hard-coded-strings -- the API reference is written for developers, in English, like the OpenAPI document it shows */
import { apiReference } from '@scalar/hono-api-reference';
import type { OpenAPIHono } from '@hono/zod-openapi';

const API_DOCUMENT_VERSION = '1';

/**
 * Registers the API's own description, and the reference page drawn from it. Both are public, so
 * the description carries a version of its own rather than the server's release, which is told only
 * to somebody signed in.
 *
 * @param app - The application to register them on.
 */
const serveReference = (app: OpenAPIHono): void => {
  app.doc('/api/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Valence API',
      version: API_DOCUMENT_VERSION,
      description: 'Self-hosted streaming platform API.',
    },
  });

  app.get(
    '/api/reference',
    apiReference({ spec: { url: '/api/openapi.json' }, pageTitle: 'Valence API' }),
  );
};

export { serveReference };
