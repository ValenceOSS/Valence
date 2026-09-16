import { createRoute, z } from '@hono/zod-openapi';
import {
  AgeExceptionListSchema,
  LibraryAccessSchema,
  SetCeilingSchema,
  SetExceptionSchema,
} from '@ValenceContracts/schemas/LibraryAccess';

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

const setCeilingRoute = createRoute({
  method: 'put',
  path: '/api/admin/accounts/{userId}/libraries/{libraryId}/ceiling',
  tags: ['Accounts'],
  summary: 'Limit this account to content at or below an age, in this library',
  request: {
    params: z.object({ userId: z.string(), libraryId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: SetCeilingSchema } } },
  },
  responses: { 204: { description: 'Set' }, 403: FOR_ADMINISTRATORS, 404: NO_SUCH_LIBRARY },
});

const clearCeilingRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}/libraries/{libraryId}/ceiling',
  tags: ['Accounts'],
  summary: 'Lift the age limit on this library for this account',
  request: { params: z.object({ userId: z.string(), libraryId: z.string().uuid() }) },
  responses: { 204: { description: 'Lifted' }, 403: FOR_ADMINISTRATORS },
});

const readExceptionsRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts/{userId}/exceptions',
  tags: ['Accounts'],
  summary: 'Read what has been allowed or denied for this account regardless of its ceiling',
  request: { params: z.object({ userId: z.string() }) },
  responses: {
    200: {
      description: 'The exceptions granted against this account',
      content: { 'application/json': { schema: AgeExceptionListSchema.openapi('AgeExceptions') } },
    },
    403: FOR_ADMINISTRATORS,
  },
});

const setExceptionRoute = createRoute({
  method: 'put',
  path: '/api/admin/accounts/{userId}/exceptions',
  tags: ['Accounts'],
  summary: 'Allow or deny one thing for this account, whatever its ceiling says',
  request: {
    params: z.object({ userId: z.string() }),
    body: { content: { 'application/json': { schema: SetExceptionSchema } } },
  },
  responses: { 204: { description: 'Set' }, 403: FOR_ADMINISTRATORS, 404: NO_SUCH_LIBRARY },
});

const clearExceptionRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}/exceptions/{kind}/{subjectId}',
  tags: ['Accounts'],
  summary: 'Forget an exception, leaving the ceiling to decide again',
  request: {
    params: z.object({
      userId: z.string(),
      kind: z.enum(['item', 'series']),
      subjectId: z.string().uuid(),
    }),
  },
  responses: { 204: { description: 'Forgotten' }, 403: FOR_ADMINISTRATORS },
});

export {
  readLibraryAccessRoute,
  allowLibraryRoute,
  refuseLibraryRoute,
  setCeilingRoute,
  clearCeilingRoute,
  readExceptionsRoute,
  setExceptionRoute,
  clearExceptionRoute,
};
