import { createRoute, z } from '@hono/zod-openapi';
import { BookMatchListSchema } from '@ValenceContracts/schemas/BookMatch';
import { MusicCatalogueHitSchema } from '@ValenceContracts/schemas/MediaRequest';

const CorrectionError = z.object({ error: z.string() }).openapi('CorrectionError');

const json = <Schema extends z.ZodType>(description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const refused = {
  404: json('Not there, or not for you', CorrectionError),
};

const Corrected = z.object({ corrected: z.boolean() }).openapi('Corrected');

const searchBookMatchesRoute = createRoute({
  method: 'get',
  path: '/api/admin/books/matches',
  tags: ['Admin'],
  summary: 'Search Open Library for what a book really is',
  request: { query: z.object({ q: z.string().max(200) }) },
  responses: {
    200: json('What was found', BookMatchListSchema.openapi('BookMatchList')),
    ...refused,
  },
});

const correctBookRoute = createRoute({
  method: 'post',
  path: '/api/admin/books/{bookId}/match',
  tags: ['Admin'],
  summary: 'Say which Open Library work a book is',
  request: {
    params: z.object({ bookId: z.string().min(1) }),
    body: {
      content: {
        'application/json': { schema: z.object({ openLibraryId: z.number().int().positive() }) },
      },
    },
  },
  responses: { 200: json('It is corrected', Corrected), ...refused },
});

const forgetBookCorrectionRoute = createRoute({
  method: 'delete',
  path: '/api/admin/books/{bookId}/match',
  tags: ['Admin'],
  summary: 'Go back to what a book’s file says it is, from the next scan',
  request: { params: z.object({ bookId: z.string().min(1) }) },
  responses: { 200: json('The correction is forgotten', Corrected), ...refused },
});

const searchAlbumMatchesRoute = createRoute({
  method: 'get',
  path: '/api/admin/music/albums/matches',
  tags: ['Admin'],
  summary: 'Search MusicBrainz for what record an album really is',
  request: { query: z.object({ q: z.string().max(200) }) },
  responses: {
    200: json('What was found', z.object({ matches: z.array(MusicCatalogueHitSchema) })),
    ...refused,
  },
});

const correctAlbumRoute = createRoute({
  method: 'post',
  path: '/api/admin/music/albums/{albumId}/match',
  tags: ['Admin'],
  summary: 'Say which record an album is, and take its cover',
  request: {
    params: z.object({ albumId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            releaseGroupId: z.string().uuid(),
            title: z.string().min(1),
            artist: z.string().nullable(),
          }),
        },
      },
    },
  },
  responses: { 200: json('It is corrected', Corrected), ...refused },
});

const forgetAlbumCorrectionRoute = createRoute({
  method: 'delete',
  path: '/api/admin/music/albums/{albumId}/match',
  tags: ['Admin'],
  summary: 'Go back to what an album’s files say, from the next scan',
  request: { params: z.object({ albumId: z.string().uuid() }) },
  responses: { 200: json('The correction is forgotten', Corrected), ...refused },
});

export {
  correctAlbumRoute,
  correctBookRoute,
  forgetAlbumCorrectionRoute,
  forgetBookCorrectionRoute,
  searchAlbumMatchesRoute,
  searchBookMatchesRoute,
};
