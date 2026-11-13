import { bodyOf } from '@ValenceI18n/bodyOf';
import {
  deleteLibraryFileRoute,
  listLibraryFilesRoute,
  listMediaPathsRoute,
  measureLibraryFolderRoute,
  moveLibraryFileRoute,
  readMediaOriginsRoute,
  renameLibraryFileRoute,
  searchLibraryFilesRoute,
} from '@ValenceServer/routes/FilesRoute';
import { listLibraryFolder } from '@ValenceServer/files/listLibraryFolder';
import { describeEntriesIn } from '@ValenceServer/files/describeEntriesIn';
import { withOrigins } from '@ValenceServer/origins/withOrigins';
import { measureLibraryFolder } from '@ValenceServer/files/measureLibraryFolder';
import { searchLibraryFiles } from '@ValenceServer/files/searchLibraryFiles';
import { deleteLibraryEntry } from '@ValenceServer/files/deleteLibraryEntry';
import { moveLibraryEntry } from '@ValenceServer/files/moveLibraryEntry';
import { librariesOnThisDisk } from '@ValenceServer/files/librariesOnThisDisk';
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
  const { library, folderDisk, requires, settleChange, recordAudit, readOrigins, viewerOf } =
    context;

  /**
   * Reads the libraries whose files are on this server and which whoever is asking may see, which
   * are all the file manager may reach for them.
   *
   * @param headers - The request's headers.
   * @returns Those libraries.
   */
  const onThisDisk = async (headers: Headers) => {
    const viewer = await viewerOf(headers);

    return viewer === null ? [] : librariesOnThisDisk(await library.list(viewer));
  };

  app.openapi(listLibraryFilesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const libraries = await onThisDisk(context.req.raw.headers);
    const listed = await listLibraryFolder(
      libraries,
      context.req.valid('query').path,
      withOrigins(
        (entries) => describeEntriesIn(libraries, entries, library.readEntryFacts),
        readOrigins,
      ),
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
      await onThisDisk(context.req.raw.headers),
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

    const { libraryId } = context.req.valid('query');
    const reachable = await onThisDisk(context.req.raw.headers);

    return context.json(
      {
        paths: reachable.some((one) => one.id === libraryId)
          ? await library.mediaPathsIn(libraryId)
          : {},
      },
      200,
    );
  });

  app.openapi(searchLibraryFilesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { words, within } = context.req.valid('query');
    const libraries = await onThisDisk(context.req.raw.headers);
    const found = await searchLibraryFiles(
      folderDisk,
      libraries,
      words,
      within,
      withOrigins(
        (entries) => describeEntriesIn(libraries, entries, library.readEntryFacts),
        readOrigins,
      ),
    );

    return found.kind === 'found'
      ? context.json(found.search, 200)
      : context.json(refuse('error.common.thatIsNotInsideALibrary'), 403);
  });

  app.openapi(readMediaOriginsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json({ origins: await readOrigins(context.req.valid('json').paths) }, 200);
  });

  app.openapi(deleteLibraryFileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const settled = await settleChange(
      await deleteLibraryEntry(
        await onThisDisk(context.req.raw.headers),
        context.req.valid('query').path,
      ),
    );

    if ('path' in settled) {
      await recordAudit(context, 'files.removed', context.req.valid('query').path);

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
      await moveLibraryEntry(await onThisDisk(context.req.raw.headers), path, { name }),
    );

    if ('path' in settled) {
      await recordAudit(context, 'files.renamed', path, { to: settled.path });
    }

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
      await moveLibraryEntry(await onThisDisk(context.req.raw.headers), path, { into }),
    );

    if ('path' in settled) {
      await recordAudit(context, 'files.moved', path, { to: settled.path });
    }

    return 'path' in settled
      ? context.json({ path: settled.path }, 200)
      : context.json(bodyOf(settled), settled.status);
  });
};

export { serveFiles };
