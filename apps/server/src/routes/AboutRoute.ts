import { createRoute } from '@hono/zod-openapi';
import { AboutSchema } from '@ValenceContracts/schemas/About';

const AboutResponse = AboutSchema.openapi('About');

const aboutRoute = createRoute({
  method: 'get',
  path: '/api/about',
  tags: ['Setup'],
  summary: 'Report what this server is running',
  responses: {
    200: {
      description: 'The commit this server was started from',
      content: { 'application/json': { schema: AboutResponse } },
    },
  },
});

export { aboutRoute };
