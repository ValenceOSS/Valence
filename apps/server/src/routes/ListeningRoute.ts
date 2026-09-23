import { createRoute, z } from '@hono/zod-openapi';
import {
  BookListeningListSchema,
  ListeningProgressAnswerSchema,
  SaveListeningProgressSchema,
} from '@ValenceContracts/schemas/Book';

const ListeningError = z.object({ error: z.string() }).openapi('ListeningError');

const json = <Schema extends z.ZodType>(description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const BookParams = z.object({ bookId: z.string().uuid() });

const streamChapterAudioRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/chapters/{chapterId}/audio',
  tags: ['Books'],
  summary: 'Listen to one of an audiobook’s tracks, from anywhere in it',
  request: { params: z.object({ bookId: z.string().uuid(), chapterId: z.string().uuid() }) },
  responses: {
    200: { description: 'The track' },
    206: { description: 'Part of the track' },
    401: json('Not signed in', ListeningError),
    404: json('No such track to listen to', ListeningError),
  },
});

const saveListeningRoute = createRoute({
  method: 'put',
  path: '/api/books/{bookId}/listening',
  tags: ['Books'],
  summary: 'Say where somebody has got to in an audiobook',
  request: {
    params: BookParams,
    body: {
      content: { 'application/json': { schema: SaveListeningProgressSchema } },
      required: true,
    },
  },
  responses: {
    204: { description: 'Kept' },
    401: json('Not signed in', ListeningError),
    404: json('No such track in that book', ListeningError),
  },
});

const readListeningRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/listening',
  tags: ['Books'],
  summary: 'Where somebody has got to in an audiobook',
  request: { params: BookParams },
  responses: {
    200: json('Where they are, or nothing', ListeningProgressAnswerSchema),
    401: json('Not signed in', ListeningError),
  },
});

const listListeningRoute = createRoute({
  method: 'get',
  path: '/api/listening',
  tags: ['Books'],
  summary: 'The audiobooks somebody is partway through, the latest first',
  request: {
    query: z.object({ limit: z.coerce.number().int().positive().max(100).default(20) }),
  },
  responses: {
    200: json('What they are listening to', BookListeningListSchema),
    401: json('Not signed in', ListeningError),
  },
});

const forgetListeningRoute = createRoute({
  method: 'delete',
  path: '/api/books/{bookId}/listening',
  tags: ['Books'],
  summary: 'Forget where somebody had got to in an audiobook',
  request: { params: BookParams },
  responses: {
    204: { description: 'Forgotten' },
    401: json('Not signed in', ListeningError),
  },
});

export {
  forgetListeningRoute,
  listListeningRoute,
  readListeningRoute,
  saveListeningRoute,
  streamChapterAudioRoute,
};
