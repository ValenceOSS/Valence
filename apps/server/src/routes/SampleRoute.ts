import { createRoute, z } from '@hono/zod-openapi';

const SampleError = z.object({ error: z.string() }).openapi('SampleError');

const findASampleRoute = createRoute({
  method: 'get',
  path: '/api/requests/sample',
  tags: ['Requests'],
  summary: 'Find half a minute of an album to hear before asking for it',
  request: {
    query: z.object({ artist: z.string().min(1).max(200), album: z.string().min(1).max(300) }),
  },
  responses: {
    200: {
      description: 'Where the sample plays from, or nothing where none is offered',
      content: {
        'application/json': {
          schema: z.object({ url: z.string().url().nullable() }).openapi('Sample'),
        },
      },
    },
    403: {
      description: 'Not somebody who may ask for music',
      content: { 'application/json': { schema: SampleError } },
    },
  },
});

export { findASampleRoute };
