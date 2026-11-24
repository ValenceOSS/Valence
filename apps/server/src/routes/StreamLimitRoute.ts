import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { StreamLimitSchema } from '@ValenceContracts/schemas/StreamLimit';

const StreamLimit = StreamLimitSchema.openapi('StreamLimit');

const StreamLimitError = RefusalSchema.openapi('StreamLimitError');

const AccountStreamLimit = z
  .object({
    own: StreamLimit,
    effective: StreamLimit,
    streamsNow: z.number().int().nonnegative(),
  })
  .openapi('AccountStreamLimit');

const forbidden = {
  description: 'Not allowed to manage accounts',
  content: { 'application/json': { schema: StreamLimitError } },
};

const forbiddenRoles = {
  description: 'Not allowed to manage roles',
  content: { 'application/json': { schema: StreamLimitError } },
};

const readMyStreamLimitRoute = createRoute({
  method: 'get',
  path: '/api/account/stream-limit',
  tags: ['Account'],
  summary: 'Read the limit the account signed in streams under',
  description:
    'Its highest role’s limit, made stricter by its own, so a player can show what is out of reach before somebody picks it.',
  responses: {
    200: {
      description: 'The limit it streams under',
      content: { 'application/json': { schema: StreamLimit } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: StreamLimitError } },
    },
  },
});

const readAccountStreamLimitRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts/{userId}/stream-limit',
  tags: ['Admin'],
  summary: 'Read the highest bitrate an account may stream at and how many streams it may have',
  request: { params: z.object({ userId: z.string().min(1) }) },
  responses: {
    200: {
      description:
        'Its own limit, the one it streams under once its roles are counted, and how many streams it has now',
      content: { 'application/json': { schema: AccountStreamLimit } },
    },
    403: forbidden,
  },
});

const setAccountStreamLimitRoute = createRoute({
  method: 'put',
  path: '/api/admin/accounts/{userId}/stream-limit',
  tags: ['Admin'],
  summary: 'Set the highest bitrate an account may stream at and how many streams it may have',
  request: {
    params: z.object({ userId: z.string().min(1) }),
    body: { content: { 'application/json': { schema: StreamLimit } } },
  },
  responses: {
    200: {
      description: 'The limit as it now stands',
      content: { 'application/json': { schema: AccountStreamLimit } },
    },
    403: forbidden,
  },
});

const noSuchRole = {
  description: 'There is no such role',
  content: { 'application/json': { schema: StreamLimitError } },
};

const readRoleStreamLimitRoute = createRoute({
  method: 'get',
  path: '/api/admin/roles/{roleId}/stream-limit',
  tags: ['Admin'],
  summary: 'Read the limit everybody holding a role streams under',
  request: { params: z.object({ roleId: z.string().min(1) }) },
  responses: {
    200: {
      description: 'The role’s limit',
      content: { 'application/json': { schema: StreamLimit } },
    },
    403: forbiddenRoles,
    404: noSuchRole,
  },
});

const setRoleStreamLimitRoute = createRoute({
  method: 'put',
  path: '/api/admin/roles/{roleId}/stream-limit',
  tags: ['Admin'],
  summary: 'Set the limit everybody holding a role streams under',
  request: {
    params: z.object({ roleId: z.string().min(1) }),
    body: { content: { 'application/json': { schema: StreamLimit } } },
  },
  responses: {
    200: {
      description: 'The role’s limit as it now stands',
      content: { 'application/json': { schema: StreamLimit } },
    },
    403: forbiddenRoles,
    404: noSuchRole,
  },
});

export {
  readMyStreamLimitRoute,
  readAccountStreamLimitRoute,
  readRoleStreamLimitRoute,
  setAccountStreamLimitRoute,
  setRoleStreamLimitRoute,
};
