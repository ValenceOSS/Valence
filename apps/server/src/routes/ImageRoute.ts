import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';

const ImageError = RefusalSchema.openapi('ImageError');

const mediaImageRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/image/{kind}',
  tags: ['Library'],
  summary: 'Read the poster, backdrop or logo for an item',
  request: {
    params: z.object({
      mediaId: z.string().uuid(),
      kind: z.enum(['poster', 'backdrop', 'logo']),
    }),
    query: z.object({
      of: z.enum(['title']).optional().openapi({
        description:
          'Asks for the title’s own picture rather than this file’s: a programme’s chosen backdrop in place of an episode still',
      }),
      size: z.enum(['small']).optional().openapi({
        description:
          'Asks for the picture narrowed for a grid, as WebP, rather than whole; a server that does not know it sends the whole picture',
      }),
    }),
  },
  responses: {
    200: { description: 'The artwork' },
    304: { description: 'The artwork has not changed since it was last fetched' },
    404: {
      description: 'No such item, or no artwork for it',
      content: { 'application/json': { schema: ImageError } },
    },
  },
});

export { mediaImageRoute };
