import { createRoute, z } from '@hono/zod-openapi';

const FavouriteError = z.object({ error: z.string() }).openapi('FavouriteError');

const FavouriteSchema = z
  .object({
    mediaId: z.string().uuid(),
    keptAt: z.string().datetime(),
  })
  .openapi('Favourite');

const FavouriteBookSchema = z
  .object({
    bookId: z.string().uuid(),
    keptAt: z.string().datetime(),
  })
  .openapi('FavouriteBook');

const FavouriteListSchema = z
  .object({ favourites: z.array(FavouriteSchema), books: z.array(FavouriteBookSchema) })
  .openapi('FavouriteList');

const listFavouritesRoute = createRoute({
  method: 'get',
  path: '/api/favourites',
  tags: ['Favourites'],
  summary: 'Read everything this viewer has kept',
  responses: {
    200: {
      description: 'What this viewer has kept',
      content: { 'application/json': { schema: FavouriteListSchema } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: FavouriteError } },
    },
  },
});

const keepFavouriteRoute = createRoute({
  method: 'put',
  path: '/api/media/{mediaId}/favourite',
  tags: ['Favourites'],
  summary: 'Keep this item',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: {
    204: { description: 'Kept' },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: FavouriteError } },
    },
    404: {
      description: 'No such media item',
      content: { 'application/json': { schema: FavouriteError } },
    },
  },
});

const dropFavouriteRoute = createRoute({
  method: 'delete',
  path: '/api/media/{mediaId}/favourite',
  tags: ['Favourites'],
  summary: 'Stop keeping this item',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: {
    204: { description: 'Dropped' },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: FavouriteError } },
    },
  },
});

const keepBookFavouriteRoute = createRoute({
  method: 'put',
  path: '/api/books/{bookId}/favourite',
  tags: ['Favourites'],
  summary: 'Keep this book',
  request: { params: z.object({ bookId: z.string().uuid() }) },
  responses: {
    204: { description: 'Kept' },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: FavouriteError } },
    },
    404: {
      description: 'No such book, or not one this viewer can see',
      content: { 'application/json': { schema: FavouriteError } },
    },
  },
});

const dropBookFavouriteRoute = createRoute({
  method: 'delete',
  path: '/api/books/{bookId}/favourite',
  tags: ['Favourites'],
  summary: 'Stop keeping this book',
  request: { params: z.object({ bookId: z.string().uuid() }) },
  responses: {
    204: { description: 'Dropped' },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: FavouriteError } },
    },
  },
});

export {
  listFavouritesRoute,
  keepFavouriteRoute,
  dropFavouriteRoute,
  keepBookFavouriteRoute,
  dropBookFavouriteRoute,
};
