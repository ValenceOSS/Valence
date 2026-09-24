import { createRoute, z } from '@hono/zod-openapi';
import {
  ChangedEntrySchema,
  LibraryFileSearchSchema,
  LibraryFolderSchema,
  MoveEntryRequestSchema,
  RenameEntryRequestSchema,
} from '@ValenceContracts/schemas/LibraryFiles';

const FilesError = z.object({ error: z.string() }).openapi('FilesError');

const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: FilesError } },
});

const changed = {
  description: 'Where it is now, with a scan of each library it touched on its way',
  content: { 'application/json': { schema: ChangedEntrySchema.openapi('ChangedEntry') } },
};

const listLibraryFilesRoute = createRoute({
  method: 'get',
  path: '/api/admin/files',
  tags: ['Admin'],
  summary: 'List what is in a folder inside a library, or the libraries themselves',
  request: { query: z.object({ path: z.string().optional() }) },
  responses: {
    200: {
      description: 'What is in it, folders first',
      content: { 'application/json': { schema: LibraryFolderSchema.openapi('LibraryFolder') } },
    },
    403: refused(
      'Not somebody who may change libraries, a folder outside every library, or one Valence cannot read',
    ),
    404: refused('No such folder'),
  },
});

const searchLibraryFilesRoute = createRoute({
  method: 'get',
  path: '/api/admin/files/search',
  tags: ['Admin'],
  summary: 'Find files and folders by name inside the libraries, a few levels below a folder',
  request: {
    query: z.object({ words: z.string().min(1).max(255), within: z.string().optional() }),
  },
  responses: {
    200: {
      description: 'What was found, nearest first',
      content: {
        'application/json': { schema: LibraryFileSearchSchema.openapi('LibraryFileSearch') },
      },
    },
    403: refused('Not somebody who may change libraries, or a folder outside every library'),
  },
});

const deleteLibraryFileRoute = createRoute({
  method: 'delete',
  path: '/api/admin/files',
  tags: ['Admin'],
  summary: 'Delete a file, or a folder with everything in it, from inside a library',
  request: { query: z.object({ path: z.string().min(1) }) },
  responses: {
    200: changed,
    400: refused('The library’s own folder, which is removed with the library instead'),
    403: refused(
      'Not somebody who may delete media, outside every library, or a disk that would not let it go',
    ),
    404: refused('Nothing is there'),
    500: refused('It could not be deleted'),
  },
});

const renameLibraryFileRoute = createRoute({
  method: 'post',
  path: '/api/admin/files/rename',
  tags: ['Admin'],
  summary: 'Rename a file or folder inside a library, where it is',
  request: {
    body: {
      content: {
        'application/json': { schema: RenameEntryRequestSchema.openapi('RenameEntry') },
      },
    },
  },
  responses: {
    200: changed,
    400: refused('A name that is a path, or the library’s own folder'),
    403: refused(
      'Not somebody who may change libraries, outside every library, or a disk that would not allow it',
    ),
    404: refused('Nothing is there'),
    409: refused('Something already has that name'),
    500: refused('It could not be renamed'),
  },
});

const moveLibraryFileRoute = createRoute({
  method: 'post',
  path: '/api/admin/files/move',
  tags: ['Admin'],
  summary: 'Move a file or folder into another folder inside a library, keeping its name',
  request: {
    body: {
      content: { 'application/json': { schema: MoveEntryRequestSchema.openapi('MoveEntry') } },
    },
  },
  responses: {
    200: changed,
    400: refused('The library’s own folder, a folder moved into itself, or a move between disks'),
    403: refused(
      'Not somebody who may change libraries, outside every library, or a disk that would not allow it',
    ),
    404: refused('Nothing is there, or no such folder to move it into'),
    409: refused('Something of that name is already there'),
    500: refused('It could not be moved'),
  },
});

export {
  deleteLibraryFileRoute,
  listLibraryFilesRoute,
  moveLibraryFileRoute,
  renameLibraryFileRoute,
  searchLibraryFilesRoute,
};
