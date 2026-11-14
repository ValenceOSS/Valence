/* oxlint-disable valence/no-hard-coded-strings -- the API description is written for developers, in English, like the OpenAPI document it is */
import type { OpenAPIHono } from '@hono/zod-openapi';

const API_DOCUMENT_VERSION = '1';

/**
 * Registers the API's own description, which is public, so it carries a version of its own rather
 * than the server's release, which is told only to somebody signed in.
 *
 * @param app - The application to register it on.
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
};

export { serveReference };
