import { say } from '@ValenceI18n/say';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import {
  deleteLibraryFileRoute,
  listLibraryFilesRoute,
  moveLibraryFileRoute,
  renameLibraryFileRoute,
  searchLibraryFilesRoute,
} from '@ValenceServer/routes/FilesRoute';
import { listLibraryFolder } from '@ValenceServer/files/listLibraryFolder';
import { searchLibraryFiles } from '@ValenceServer/files/searchLibraryFiles';
import { deleteLibraryEntry } from '@ValenceServer/files/deleteLibraryEntry';
import { moveLibraryEntry } from '@ValenceServer/files/moveLibraryEntry';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the files endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveFiles = (app: OpenAPIHono, context: AppContext): void => {
  const { library, folderDisk, requires, settleChange } = context;

  app.openapi(listLibraryFilesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const listed = await listLibraryFolder(
      await library.list(asTheServer),
      context.req.valid('query').path,
      library.mediaIdsAt,
    );

    switch (listed.kind) {
      case 'listed':
        return context.json(listed.folder, 200);
      case 'missing':
        return context.json({ error: say('server.errors.noSuchFolder') }, 404);
      case 'outside':
        return context.json({ error: say('server.errors.notInsideLibrary') }, 403);
      case 'readOnly':
      case 'denied':
      case 'failed':
        return context.json({ error: say('server.errors.mayNotReadFolder') }, 403);
    }
  });

  app.openapi(searchLibraryFilesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { words, within } = context.req.valid('query');
    const found = await searchLibraryFiles(
      folderDisk,
      await library.list(asTheServer),
      words,
      within,
      library.mediaIdsAt,
    );

    return found.kind === 'found'
      ? context.json(found.search, 200)
      : context.json({ error: say('server.errors.notInsideLibrary') }, 403);
  });

  app.openapi(deleteLibraryFileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const settled = await settleChange(
      await deleteLibraryEntry(await library.list(asTheServer), context.req.valid('query').path),
    );

    if ('path' in settled) {
      return context.json({ path: settled.path }, 200);
    }

    return settled.status === 409
      ? context.json({ error: settled.error }, 500)
      : context.json({ error: settled.error }, settled.status);
  });

  app.openapi(renameLibraryFileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { path, name } = context.req.valid('json');

    const settled = await settleChange(
      await moveLibraryEntry(await library.list(asTheServer), path, { name }),
    );

    return 'path' in settled
      ? context.json({ path: settled.path }, 200)
      : context.json({ error: settled.error }, settled.status);
  });

  app.openapi(moveLibraryFileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { path, into } = context.req.valid('json');

    const settled = await settleChange(
      await moveLibraryEntry(await library.list(asTheServer), path, { into }),
    );

    return 'path' in settled
      ? context.json({ path: settled.path }, 200)
      : context.json({ error: settled.error }, settled.status);
  });
};

export { serveFiles };
