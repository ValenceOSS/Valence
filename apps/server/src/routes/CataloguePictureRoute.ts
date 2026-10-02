import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';

const CataloguePictureError = RefusalSchema.openapi('CataloguePictureError');

const cataloguePictureRoute = createRoute({
  method: 'get',
  path: '/api/catalogue/pictures/{size}/{file}',
  tags: ['Library'],
  summary: 'Read one of the catalogue’s pictures, kept on this server',
  description:
    'Serves a poster, backdrop, logo or episode still from the catalogue through the same store the library keeps its artwork in, so a title asked for and later filed into the library reuses what was fetched for it.',
  request: {
    params: z.object({
      size: z.string().regex(/^(?:w\d{2,4}|h\d{2,4}|original)$/),
      file: z.string().regex(/^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|svg)$/),
    }),
  },
  responses: {
    200: { description: 'The picture' },
    404: {
      description: 'The catalogue has no such picture, or it could not be fetched',
      content: { 'application/json': { schema: CataloguePictureError } },
    },
  },
});

export { cataloguePictureRoute };
