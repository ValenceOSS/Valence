import { createRoute, z } from '@hono/zod-openapi';
import {
  CreateFolderRequestSchema,
  FolderListingSchema,
  FolderSchema,
} from '@ValenceContracts/schemas/Folder';

const FolderError = z.object({ error: z.string() }).openapi('FolderError');

const listFoldersRoute = createRoute({
  method: 'get',
  path: '/api/admin/folders',
  tags: ['Admin'],
  summary: 'List the folders inside a folder on the server, to choose where a library lives',
  request: {
    query: z.object({ path: z.string().optional() }),
  },
  responses: {
    200: {
      description: 'The folders inside it, or the places worth starting from where none is named',
      content: { 'application/json': { schema: FolderListingSchema } },
    },
    400: {
      description: 'A path that does not start from the root',
      content: { 'application/json': { schema: FolderError } },
    },
    403: {
      description: 'Not somebody who may add a library, or a folder Valence cannot read',
      content: { 'application/json': { schema: FolderError } },
    },
    404: {
      description: 'No such folder',
      content: { 'application/json': { schema: FolderError } },
    },
  },
});

const createFolderRoute = createRoute({
  method: 'post',
  path: '/api/admin/folders',
  tags: ['Admin'],
  summary: 'Make a new folder inside one on the server, to have somewhere to keep a library',
  request: {
    body: {
      content: {
        'application/json': { schema: CreateFolderRequestSchema.openapi('CreateFolder') },
      },
    },
  },
  responses: {
    201: {
      description: 'The folder that was made',
      content: { 'application/json': { schema: FolderSchema.openapi('CreatedFolder') } },
    },
    400: {
      description: 'A parent that does not start from the root, or a name that is not one name',
      content: { 'application/json': { schema: FolderError } },
    },
    403: {
      description:
        'Not somebody who may add a library, or a place Valence may not write, such as a disk mounted read-only',
      content: { 'application/json': { schema: FolderError } },
    },
    404: {
      description: 'No such folder to make it in',
      content: { 'application/json': { schema: FolderError } },
    },
    409: {
      description: 'Something of that name is already there',
      content: { 'application/json': { schema: FolderError } },
    },
  },
});

export { createFolderRoute, listFoldersRoute };
