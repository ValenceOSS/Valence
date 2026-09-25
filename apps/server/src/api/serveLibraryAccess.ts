import { say } from '@ValenceI18n/say';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import {
  readExceptionsOnRoute,
  readLibraryAccessRoute,
  allowLibraryRoute,
  refuseLibraryRoute,
  setCeilingRoute,
  clearCeilingRoute,
  readExceptionsRoute,
  setExceptionRoute,
  clearExceptionRoute,
} from '@ValenceServer/routes/LibraryAccessRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the library access endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveLibraryAccess = (app: OpenAPIHono, context: AppContext): void => {
  const { library, requires, readAccount, mayDecideAccess } = context;

  app.openapi(readLibraryAccessRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    const [shelves, refused, ceilings] = await Promise.all([
      library.list(asTheServer),
      library.refusedLibraries(userId),
      library.ceilingsFor(userId),
    ]);

    return context.json(
      {
        libraries: shelves.map((shelf) => {
          const ceiling = ceilings.find((one) => one.libraryId === shelf.id);

          return {
            id: shelf.id,
            name: shelf.name,
            mayView: !refused.includes(shelf.id),
            maximumAge: ceiling?.maximumAge ?? null,
            allowsUnrated: ceiling?.allowsUnrated ?? false,
          };
        }),
      },
      200,
    );
  });

  app.openapi(allowLibraryRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    if ((await library.list(asTheServer)).every((shelf) => shelf.id !== libraryId)) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    await library.allowLibrary(userId, libraryId);

    return context.body(null, 204);
  });

  app.openapi(refuseLibraryRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    if ((await library.list(asTheServer)).every((shelf) => shelf.id !== libraryId)) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    await library.refuseLibrary(userId, libraryId);

    return context.body(null, 204);
  });

  app.openapi(setCeilingRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    if ((await library.list(asTheServer)).every((shelf) => shelf.id !== libraryId)) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    const { maximumAge, allowsUnrated } = context.req.valid('json');

    await library.setCeiling(userId, { libraryId, maximumAge, allowsUnrated });

    return context.body(null, 204);
  });

  app.openapi(clearCeilingRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    await library.clearCeiling(userId, libraryId);

    return context.body(null, 204);
  });

  app.openapi(readExceptionsRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    return context.json({ exceptions: await library.exceptionsFor(userId) }, 200);
  });

  app.openapi(readExceptionsOnRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { kind, subjectId } = context.req.valid('param');

    return context.json({ accounts: await library.exceptionsOn({ kind, subjectId }) }, 200);
  });

  app.openapi(setExceptionRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    const { kind, subjectId, effect } = context.req.valid('json');
    const actor = await readAccount(context.req.raw.headers);

    if (!(await library.setException(userId, { kind, subjectId }, effect, actor?.id ?? null))) {
      return context.json({ error: say('server.errors.noSuchException') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(clearExceptionRoute, async (context) => {
    const { userId, kind, subjectId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    await library.clearException(userId, { kind, subjectId });

    return context.body(null, 204);
  });
};

export { serveLibraryAccess };
