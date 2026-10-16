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
    403: forbidden,
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
    403: forbidden,
  },
});

export {
  readAccountStreamLimitRoute,
  readRoleStreamLimitRoute,
  setAccountStreamLimitRoute,
  setRoleStreamLimitRoute,
};
