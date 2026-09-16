import { createRoute, z } from '@hono/zod-openapi';
import { LibraryAccessSchema } from '@ValenceContracts/schemas/LibraryAccess';

const AccessError = z.object({ error: z.string() }).openapi('LibraryAccessError');

const Access = LibraryAccessSchema.openapi('LibraryAccess');

const FOR_ADMINISTRATORS = {
  description: 'Not allowed to manage this account',
  content: { 'application/json': { schema: AccessError } },
};

const NO_SUCH_LIBRARY = {
  description: 'No such library',
  content: { 'application/json': { schema: AccessError } },
};

const readLibraryAccessRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts/{userId}/libraries',
  tags: ['Accounts'],
  summary: 'Read which libraries an account may see',
  request: { params: z.object({ userId: z.string() }) },
  responses: {
    200: {
      description: 'Every library, and whether this account sees it',
      content: { 'application/json': { schema: Access } },
    },
    403: FOR_ADMINISTRATORS,
  },
});

const allowLibraryRoute = createRoute({
  method: 'put',
  path: '/api/admin/accounts/{userId}/libraries/{libraryId}',
  tags: ['Accounts'],
  summary: 'Let this account see this library',
  request: { params: z.object({ userId: z.string(), libraryId: z.string().uuid() }) },
  responses: { 204: { description: 'Allowed' }, 403: FOR_ADMINISTRATORS, 404: NO_SUCH_LIBRARY },
});

const refuseLibraryRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}/libraries/{libraryId}',
  tags: ['Accounts'],
  summary: 'Keep this library from this account',
  request: { params: z.object({ userId: z.string(), libraryId: z.string().uuid() }) },
  responses: { 204: { description: 'Refused' }, 403: FOR_ADMINISTRATORS, 404: NO_SUCH_LIBRARY },
});

export { readLibraryAccessRoute, allowLibraryRoute, refuseLibraryRoute };
