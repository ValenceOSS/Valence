import {
  correctAlbumRoute,
  correctBookRoute,
  forgetAlbumCorrectionRoute,
  forgetBookCorrectionRoute,
  searchAlbumMatchesRoute,
  searchBookMatchesRoute,
} from '@ValenceServer/routes/CorrectionRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

const NOT_FOR_YOU = { error: 'That is for administrators.' } as const;

/**
 * Registers the endpoints an administrator tells a book or an album what it really is with, for one
 * its files or a lookup took for something else — the same correction a film or a series has.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveCorrections = (app: OpenAPIHono, context: AppContext): void => {
  const { books, music, requires } = context;

  const mayCorrect = (headers: Headers): Promise<boolean> => requires(headers, 'media.override');

  app.openapi(searchBookMatchesRoute, async (context) => {
    if (books === undefined || !(await mayCorrect(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json({ matches: await books.searchMatches(context.req.valid('query').q) }, 200);
  });

  app.openapi(correctBookRoute, async (context) => {
    if (books === undefined || !(await mayCorrect(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const corrected = await books.correct(
      context.req.valid('param').bookId,
      context.req.valid('json').openLibraryId,
    );

    return corrected
      ? context.json({ corrected }, 200)
      : context.json({ error: 'That book, or that work on Open Library, was not found.' }, 404);
  });

  app.openapi(forgetBookCorrectionRoute, async (context) => {
    if (books === undefined || !(await mayCorrect(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const corrected = await books.forgetCorrection(context.req.valid('param').bookId);

    return corrected
      ? context.json({ corrected: false }, 200)
      : context.json({ error: 'No such book.' }, 404);
  });

  app.openapi(searchAlbumMatchesRoute, async (context) => {
    if (music === undefined || !(await mayCorrect(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(
      { matches: await music.corrections.search(context.req.valid('query').q) },
      200,
    );
  });

  app.openapi(correctAlbumRoute, async (context) => {
    if (music === undefined || !(await mayCorrect(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const corrected = await music.corrections.correct(
      context.req.valid('param').albumId,
      context.req.valid('json'),
    );

    return corrected
      ? context.json({ corrected }, 200)
      : context.json({ error: 'No such album.' }, 404);
  });

  app.openapi(forgetAlbumCorrectionRoute, async (context) => {
    if (music === undefined || !(await mayCorrect(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const corrected = await music.corrections.forget(context.req.valid('param').albumId);

    return corrected
      ? context.json({ corrected: false }, 200)
      : context.json({ error: 'No such album.' }, 404);
  });
};

export { serveCorrections };
