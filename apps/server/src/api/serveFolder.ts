import {
  createFolderRoute,
  listFoldersRoute,
  searchFoldersRoute,
} from '@ValenceServer/routes/FolderRoute';
import { searchFolders } from '@ValenceServer/folders/searchFolders';
import { createFolder } from '@ValenceServer/folders/createFolder';
import { listFolders } from '@ValenceServer/folders/listFolders';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the folder endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveFolder = (app: OpenAPIHono, context: AppContext): void => {
  const { folderDisk, requires } = context;

  app.openapi(searchFoldersRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { words, within } = context.req.valid('query');
    const found = await searchFolders(folderDisk, words, within);

    return found.kind === 'found'
      ? context.json(found.search, 200)
      : context.json(refuse('error.folder.giveTheWholePathStartingFrom'), 400);
  });

  app.openapi(listFoldersRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const found = await listFolders(folderDisk, context.req.valid('query').path);

    switch (found.kind) {
      case 'listed':
        return context.json(found.listing, 200);
      case 'relative':
        return context.json(refuse('error.folder.giveTheWholePathStartingFrom'), 400);
      case 'missing':
        return context.json(refuse('error.common.thereIsNoSuchFolder'), 404);
      case 'unreadable':
        return context.json(refuse('error.common.valenceIsNotAllowedToRead'), 403);
    }
  });

  app.openapi(createFolderRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { path, name } = context.req.valid('json');
    const made = await createFolder(folderDisk, path, name);

    switch (made.kind) {
      case 'created':
        return context.json(made.folder, 201);
      case 'relative':
        return context.json(refuse('error.folder.giveTheWholePathStartingFrom'), 400);
      case 'badName':
        return context.json(refuse('error.folder.aFoldersNameIsASingle'), 400);
      case 'exists':
        return context.json(refuse('error.server.somethingOfThatNameIsAlready'), 409);
      case 'missing':
        return context.json(refuse('error.folder.thereIsNoSuchFolderTo'), 404);
      case 'readOnly':
        return context.json(refuse('error.folder.thatDiskIsReadOnlyTo'), 403);
      case 'denied':
        return context.json(refuse('error.folder.valenceIsNotAllowedToMake'), 403);
    }
  });
};

export { serveFolder };
