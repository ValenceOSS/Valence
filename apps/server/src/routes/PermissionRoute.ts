import { createRoute } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { MyPermissionsSchema } from '@ValenceContracts/schemas/Permission';

const PermissionError = RefusalSchema.openapi('PermissionError');

const MyPermissionsAnswer = MyPermissionsSchema.openapi('MyPermissions');

const listMyPermissionsRoute = createRoute({
  method: 'get',
  path: '/api/account/permissions',
  tags: ['Account'],
  summary: 'List what the account signed in may do',
  responses: {
    200: {
      description: 'What this account may do, and whether that amounts to administering the server',
      content: { 'application/json': { schema: MyPermissionsAnswer } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: PermissionError } },
    },
  },
});

export { listMyPermissionsRoute };
