import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';

const ARTWORK_FILE = /^[0-9a-f]{32}-w\d{2,4}\.webp$/u;

const artworkRoute = createRoute({
  method: 'get',
  path: '/api/artwork/{file}',
  tags: ['Library'],
  summary: 'Read a picture by the name it is served under',
  description:
    'A narrowed picture, named by a key only this server can work out, so it is served without signing in and kept by browsers and proxies for good. The library’s own image addresses send a browser here. A proxy in front of the server may serve these straight from the folder they are kept in, asking the server only for those it does not have yet.',
  request: {
    params: z.object({
      file: z
        .string()
        .regex(ARTWORK_FILE)
        .openapi({ example: `${'0'.repeat(32)}-w342.webp` }),
    }),
  },
  responses: {
    200: { description: 'The picture, as WebP' },
    404: {
      description: 'No picture goes by that name',
      content: { 'application/json': { schema: RefusalSchema } },
    },
  },
});

export { artworkRoute };
