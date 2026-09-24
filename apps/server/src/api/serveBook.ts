import {
  listBooksRoute,
  findBooksRoute,
  forgetBookReadingRoute,
  forgetReadingRoute,
  listReadingRoute,
  readBookContentsRoute,
  readBookCoverRoute,
  readBookDocumentRoute,
  readBookPageRoute,
  readBookResourceRoute,
  readBookRoute,
  readReadingProgressRoute,
  saveReadingProgressRoute,
} from '@ValenceServer/routes/BookRoute';
import { registerListeningRoutes } from '@ValenceServer/books/registerListeningRoutes';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the book endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveBook = (app: OpenAPIHono, context: AppContext): void => {
  const { books, streamBookFile, viewerOf, bookInReach, readProfileId } = context;

  app.openapi(findBooksRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { search, ids, limit } = context.req.valid('query');

    return context.json(
      {
        books: await books.find(viewer, {
          limit,
          ...(search === undefined ? {} : { search }),
          ...(ids === undefined ? {} : { ids }),
        }),
      },
      200,
    );
  });

  app.openapi(listReadingRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);
    const profileId = await readProfileId(context.req.raw.headers);

    if (viewer === null || profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(
      { readings: await books.listReading(viewer, profileId, context.req.valid('query').limit) },
      200,
    );
  });

  app.openapi(forgetReadingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await books.forgetReading(profileId);

    return context.body(null, 204);
  });

  app.openapi(forgetBookReadingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await books.forgetReading(profileId, context.req.valid('param').bookId);

    return context.body(null, 204);
  });

  app.openapi(listBooksRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(
      { books: await books.find(viewer, { libraryId: context.req.valid('param').libraryId }) },
      200,
    );
  });

  app.openapi(readBookRoute, async (context) => {
    const { bookId } = context.req.valid('param');
    const found =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId))
        ? null
        : await books.read(bookId);

    return found === null
      ? context.json({ error: 'No such book.' }, 404)
      : context.json(found, 200);
  });

  app.openapi(readBookCoverRoute, async (context) => {
    const { bookId } = context.req.valid('param');
    const cover =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId))
        ? null
        : await books.readCover(bookId);

    if (cover === null) {
      return context.json({ error: 'No cover for that book.' }, 404);
    }

    return context.body(cover.bytes.slice().buffer, 200, {
      'content-type': cover.contentType,
      'cache-control': 'public, max-age=604800, immutable',
    });
  });

  app.openapi(readBookPageRoute, async (context) => {
    const { bookId, chapterId, page } = context.req.valid('param');
    const { width } = context.req.valid('query');
    const read =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readPage(chapterId, page, width);

    if (read === null) {
      return context.json({ error: 'No such page.' }, 404);
    }

    return context.body(read.bytes.slice().buffer, 200, {
      'content-type': read.contentType,
      'cache-control': 'private, max-age=604800, immutable',
    });
  });

  app.openapi(readBookContentsRoute, async (context) => {
    const { bookId, chapterId } = context.req.valid('param');
    const contents =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readContents(chapterId);

    return contents === null
      ? context.json({ error: 'That is not a book that reflows.' }, 404)
      : context.json(contents, 200);
  });

  app.openapi(readBookDocumentRoute, async (context) => {
    const { bookId, chapterId } = context.req.valid('param');
    const document =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readDocument(
            chapterId,
            context.req.valid('query').part,
            (href) =>
              `/api/books/${bookId}/chapters/${chapterId}/resource?href=${encodeURIComponent(href)}`,
          );

    if (document === null) {
      return context.json({ error: 'No such part of that book.' }, 404);
    }

    return context.body(document, 200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, max-age=3600',
    });
  });

  app.openapi(readBookResourceRoute, async (context) => {
    const { bookId, chapterId } = context.req.valid('param');
    const read =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readResource(chapterId, context.req.valid('query').href);

    if (read === null) {
      return context.json({ error: 'That is not in this book.' }, 404);
    }

    return context.body(read.bytes.slice().buffer, 200, {
      'content-type': read.contentType,
      'cache-control': 'private, max-age=604800, immutable',
    });
  });

  if (books !== undefined && streamBookFile !== undefined) {
    registerListeningRoutes(app, {
      books,
      viewerOf,
      profileOf: readProfileId,
      isInReach: bookInReach,
      streamFile: streamBookFile,
    });
  }

  app.openapi(saveReadingProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);
    const { bookId, chapterId } = context.req.valid('param');

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 404);
    }

    if (!(await bookInReach(context.req.raw.headers, bookId, chapterId))) {
      return context.json({ error: 'No such chapter.' }, 404);
    }

    const saved = await books.saveProgress(profileId, chapterId, context.req.valid('json'));

    return saved ? context.body(null, 204) : context.json({ error: 'No such chapter.' }, 404);
  });

  app.openapi(readReadingProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { bookId } = context.req.valid('param');

    return context.json(
      {
        progress: (await bookInReach(context.req.raw.headers, bookId))
          ? await books.readProgress(profileId, bookId)
          : [],
      },
      200,
    );
  });
};

export { serveBook };
