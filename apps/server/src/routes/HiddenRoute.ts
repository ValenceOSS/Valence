import { createRoute, z } from '@hono/zod-openapi';
import { HiddenListSchema } from '@ValenceContracts/schemas/Hidden';

const HiddenError = z.object({ error: z.string() }).openapi('HiddenError');

const HiddenList = HiddenListSchema.openapi('HiddenList');

const NOT_SIGNED_IN = {
  description: 'Nobody is signed in',
  content: { 'application/json': { schema: HiddenError } },
};

const NO_SUCH_SUBJECT = {
  description: 'No such thing to hide',
  content: { 'application/json': { schema: HiddenError } },
};

const listHiddenRoute = createRoute({
  method: 'get',
  path: '/api/hidden',
  tags: ['Hiding'],
  summary: 'Read everything this viewer has hidden from themselves',
  responses: {
    200: {
      description: 'What this viewer has hidden',
      content: { 'application/json': { schema: HiddenList } },
    },
    401: NOT_SIGNED_IN,
  },
});

const hideMediaRoute = createRoute({
  method: 'put',
  path: '/api/media/{mediaId}/hidden',
  tags: ['Hiding'],
  summary: 'Hide this item from this viewer',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: { 204: { description: 'Hidden' }, 401: NOT_SIGNED_IN, 404: NO_SUCH_SUBJECT },
});

const showMediaRoute = createRoute({
  method: 'delete',
  path: '/api/media/{mediaId}/hidden',
  tags: ['Hiding'],
  summary: 'Bring this item back',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: { 204: { description: 'Brought back' }, 401: NOT_SIGNED_IN },
});

const hideSeriesRoute = createRoute({
  method: 'put',
  path: '/api/series/{seriesId}/hidden',
  tags: ['Hiding'],
  summary: 'Hide this programme from this viewer',
  request: { params: z.object({ seriesId: z.string().uuid() }) },
  responses: { 204: { description: 'Hidden' }, 401: NOT_SIGNED_IN, 404: NO_SUCH_SUBJECT },
});

const showSeriesRoute = createRoute({
  method: 'delete',
  path: '/api/series/{seriesId}/hidden',
  tags: ['Hiding'],
  summary: 'Bring this programme back',
  request: { params: z.object({ seriesId: z.string().uuid() }) },
  responses: { 204: { description: 'Brought back' }, 401: NOT_SIGNED_IN },
});

const hideLibraryRoute = createRoute({
  method: 'put',
  path: '/api/libraries/{libraryId}/hidden',
  tags: ['Hiding'],
  summary: 'Hide this whole library from this viewer',
  request: { params: z.object({ libraryId: z.string().uuid() }) },
  responses: { 204: { description: 'Hidden' }, 401: NOT_SIGNED_IN, 404: NO_SUCH_SUBJECT },
});

const showLibraryRoute = createRoute({
  method: 'delete',
  path: '/api/libraries/{libraryId}/hidden',
  tags: ['Hiding'],
  summary: 'Bring this library back',
  request: { params: z.object({ libraryId: z.string().uuid() }) },
  responses: { 204: { description: 'Brought back' }, 401: NOT_SIGNED_IN },
});

export {
  listHiddenRoute,
  hideMediaRoute,
  showMediaRoute,
  hideSeriesRoute,
  showSeriesRoute,
  hideLibraryRoute,
  showLibraryRoute,
};
