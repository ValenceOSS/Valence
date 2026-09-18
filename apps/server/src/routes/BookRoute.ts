import { createRoute, z } from '@hono/zod-openapi';
import {
  BookContentsSchema,
  BookDetailSchema,
  BookReadingListSchema,
  BookSchema,
  ReadingProgressSchema,
  SaveReadingProgressSchema,
} from '@ValenceContracts/schemas/Book';

const BookError = z.object({ error: z.string() }).openapi('BookError');

const BookListSchema = z.object({ books: z.array(BookSchema) }).openapi('BookList');

const BookRead = BookDetailSchema.openapi('BookDetail');

const ProgressListSchema = z
  .object({ progress: z.array(ReadingProgressSchema) })
  .openapi('ReadingProgressList');

const Readings = BookReadingListSchema.openapi('BookReadingList');

const findBooksRoute = createRoute({
  method: 'get',
  path: '/api/books',
  tags: ['Books'],
  summary: 'Find books across every library this viewer can see, by name or by id',
  request: {
    query: z.object({
      search: z.string().max(200).optional(),
      ids: z
        .string()
        .max(20_000)
        .optional()
        .transform((ids) => (ids === undefined || ids === '' ? undefined : ids.split(','))),
      limit: z.coerce.number().int().positive().max(500).default(100),
    }),
  },
  responses: {
    200: { description: 'The books', content: { 'application/json': { schema: BookListSchema } } },
    401: { description: 'Not signed in', content: { 'application/json': { schema: BookError } } },
  },
});

const listReadingRoute = createRoute({
  method: 'get',
  path: '/api/reading',
  tags: ['Books'],
  summary: 'Read where this profile is up to in every book it has opened, most recent first',
  request: {
    query: z.object({ limit: z.coerce.number().int().positive().max(200).default(100) }),
  },
  responses: {
    200: {
      description: 'Each book and where in it',
      content: { 'application/json': { schema: Readings } },
    },
    401: { description: 'Not signed in', content: { 'application/json': { schema: BookError } } },
  },
});

const forgetReadingRoute = createRoute({
  method: 'delete',
  path: '/api/reading',
  tags: ['Books'],
  summary: 'Forget where this profile is up to in every book',
  responses: {
    204: { description: 'Forgotten' },
    401: { description: 'Not signed in', content: { 'application/json': { schema: BookError } } },
  },
});

const forgetBookReadingRoute = createRoute({
  method: 'delete',
  path: '/api/books/{bookId}/progress',
  tags: ['Books'],
  summary: 'Forget where this profile is up to in one book',
  request: { params: z.object({ bookId: z.string().uuid() }) },
  responses: {
    204: { description: 'Forgotten' },
    401: { description: 'Not signed in', content: { 'application/json': { schema: BookError } } },
  },
});

const listBooksRoute = createRoute({
  method: 'get',
  path: '/api/libraries/{libraryId}/books',
  tags: ['Books'],
  summary: 'List the books in a library',
  request: { params: z.object({ libraryId: z.string().uuid() }) },
  responses: {
    200: { description: 'The books', content: { 'application/json': { schema: BookListSchema } } },
    401: { description: 'Not signed in', content: { 'application/json': { schema: BookError } } },
  },
});

const readBookRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}',
  tags: ['Books'],
  summary: 'Read a book and the chapters in it',
  request: { params: z.object({ bookId: z.string().uuid() }) },
  responses: {
    200: { description: 'The book', content: { 'application/json': { schema: BookRead } } },
    404: { description: 'No such book', content: { 'application/json': { schema: BookError } } },
  },
});

const readBookCoverRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/cover',
  tags: ['Books'],
  summary: 'Read the cover of a book, which is the first page of its first chapter',
  request: { params: z.object({ bookId: z.string().uuid() }) },
  responses: {
    200: { description: 'The cover' },
    404: { description: 'No cover', content: { 'application/json': { schema: BookError } } },
  },
});

const readBookPageRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/chapters/{chapterId}/pages/{page}',
  tags: ['Books'],
  summary: 'Read one page of a chapter, as a picture',
  request: {
    params: z.object({
      bookId: z.string().uuid(),
      chapterId: z.string().uuid(),
      page: z.coerce.number().int().nonnegative(),
    }),
    query: z.object({ width: z.coerce.number().int().positive().max(3840).optional() }),
  },
  responses: {
    200: { description: 'The page' },
    404: { description: 'No such page', content: { 'application/json': { schema: BookError } } },
  },
});

const readBookContentsRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/chapters/{chapterId}/contents',
  tags: ['Books'],
  summary: 'Read how a book that reflows is divided: its parts, and its table of contents',
  request: {
    params: z.object({ bookId: z.string().uuid(), chapterId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'How much each part holds, and where each entry of the contents starts',
      content: { 'application/json': { schema: BookContentsSchema } },
    },
    404: {
      description: 'No such book, or not one that reflows',
      content: { 'application/json': { schema: BookError } },
    },
  },
});

const readBookDocumentRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/chapters/{chapterId}/document',
  tags: ['Books'],
  summary: 'Read one part of a book that reflows, cleaned of anything that could run',
  request: {
    params: z.object({ bookId: z.string().uuid(), chapterId: z.string().uuid() }),
    query: z.object({ part: z.coerce.number().int().nonnegative() }),
  },
  responses: {
    200: { description: 'The part' },
    404: { description: 'No such part', content: { 'application/json': { schema: BookError } } },
  },
});

const readBookResourceRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/chapters/{chapterId}/resource',
  tags: ['Books'],
  summary: 'Read a picture a part of a book asks for, from inside the book',
  request: {
    params: z.object({ bookId: z.string().uuid(), chapterId: z.string().uuid() }),
    query: z.object({ href: z.string().min(1).max(1024) }),
  },
  responses: {
    200: { description: 'The picture' },
    404: {
      description: 'Not in that book',
      content: { 'application/json': { schema: BookError } },
    },
  },
});

const saveReadingProgressRoute = createRoute({
  method: 'put',
  path: '/api/books/{bookId}/chapters/{chapterId}/progress',
  tags: ['Books'],
  summary: 'Remember where somebody is up to',
  request: {
    params: z.object({ bookId: z.string().uuid(), chapterId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: SaveReadingProgressSchema } } },
  },
  responses: {
    204: { description: 'Remembered' },
    404: { description: 'No such chapter', content: { 'application/json': { schema: BookError } } },
  },
});

const readReadingProgressRoute = createRoute({
  method: 'get',
  path: '/api/books/{bookId}/progress',
  tags: ['Books'],
  summary: 'Where somebody is up to in a book',
  request: { params: z.object({ bookId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Where they are',
      content: { 'application/json': { schema: ProgressListSchema } },
    },
    401: { description: 'Not signed in', content: { 'application/json': { schema: BookError } } },
  },
});

export {
  findBooksRoute,
  forgetBookReadingRoute,
  forgetReadingRoute,
  listReadingRoute,
  listBooksRoute,
  readBookContentsRoute,
  readBookCoverRoute,
  readBookDocumentRoute,
  readBookPageRoute,
  readBookResourceRoute,
  readBookRoute,
  readReadingProgressRoute,
  saveReadingProgressRoute,
};
