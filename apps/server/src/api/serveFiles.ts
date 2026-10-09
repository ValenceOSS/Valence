import { bodyOf } from '@ValenceI18n/bodyOf';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import {
  deleteLibraryFileRoute,
  listLibraryFilesRoute,
  listMediaPathsRoute,
  measureLibraryFolderRoute,
  moveLibraryFileRoute,
  renameLibraryFileRoute,
  searchLibraryFilesRoute,
} from '@ValenceServer/routes/FilesRoute';
import { listLibraryFolder } from '@ValenceServer/files/listLibraryFolder';
import { measureLibraryFolder } from '@ValenceServer/files/measureLibraryFolder';
import { searchLibraryFiles } from '@ValenceServer/files/searchLibraryFiles';
import { deleteLibraryEntry } from '@ValenceServer/files/deleteLibraryEntry';
import { moveLibraryEntry } from '@ValenceServer/files/moveLibraryEntry';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

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
      return context.json(refuse('common.thatIsForAdministrators'), 403);
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
        return context.json(refuse('error.common.thereIsNoSuchFolder'), 404);
      case 'outside':
        return context.json(refuse('error.common.thatIsNotInsideALibrary'), 403);
      case 'readOnly':
      case 'denied':
      case 'failed':
        return context.json(refuse('error.common.valenceIsNotAllowedToRead'), 403);
    }
  });

  app.openapi(measureLibraryFolderRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const measured = await measureLibraryFolder(
      await library.list(asTheServer),
      context.req.valid('query').path,
    );

    switch (measured.kind) {
      case 'measured':
        return context.json(measured.measure, 200);
      case 'missing':
        return context.json(refuse('error.common.thereIsNoSuchFolder'), 404);
      case 'outside':
        return context.json(refuse('error.common.thatIsNotInsideALibrary'), 403);
      case 'readOnly':
      case 'denied':
      case 'failed':
        return context.json(refuse('error.common.valenceIsNotAllowedToRead'), 403);
    }
  });

  app.openapi(listMediaPathsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json(
      { paths: await library.mediaPathsIn(context.req.valid('query').libraryId) },
      200,
    );
  });

  app.openapi(searchLibraryFilesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
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
      : context.json(refuse('error.common.thatIsNotInsideALibrary'), 403);
  });

  app.openapi(deleteLibraryFileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const settled = await settleChange(
      await deleteLibraryEntry(await library.list(asTheServer), context.req.valid('query').path),
    );

    if ('path' in settled) {
      return context.json({ path: settled.path }, 200);
    }

    return settled.status === 409
      ? context.json(bodyOf(settled), 500)
      : context.json(bodyOf(settled), settled.status);
  });

  app.openapi(renameLibraryFileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { path, name } = context.req.valid('json');

    const settled = await settleChange(
      await moveLibraryEntry(await library.list(asTheServer), path, { name }),
    );

    return 'path' in settled
      ? context.json({ path: settled.path }, 200)
      : context.json(bodyOf(settled), settled.status);
  });

  app.openapi(moveLibraryFileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { path, into } = context.req.valid('json');

    const settled = await settleChange(
      await moveLibraryEntry(await library.list(asTheServer), path, { into }),
    );

    return 'path' in settled
      ? context.json({ path: settled.path }, 200)
      : context.json(bodyOf(settled), settled.status);
  });
};

export { serveFiles };
