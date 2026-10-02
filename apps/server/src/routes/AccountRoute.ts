import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { AvatarSchema, ProfileColourSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import {
  IssuedSetupLinkSchema,
  SetupLinkLifetimeSchema,
  UsernameSchema,
} from '@ValenceContracts/schemas/SetupLink';

const Account = AccountSchema.openapi('Account');

const AccountError = RefusalSchema.openapi('AccountError');

const listAccountsRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts',
  tags: ['Accounts'],
  summary: 'List the accounts on this server',
  responses: {
    200: {
      description: 'Every account, with what it holds',
      content: {
        'application/json': {
          schema: z.object({ accounts: z.array(Account), canEmailSetupLinks: z.boolean() }),
        },
      },
    },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const banAccountRoute = createRoute({
  method: 'post',
  path: '/api/admin/accounts/{userId}/ban',
  tags: ['Accounts'],
  summary: 'Stop an account signing in',
  request: {
    params: z.object({ userId: z.string().min(1) }),
    body: {
      content: { 'application/json': { schema: z.object({ reason: z.string().max(200) }) } },
    },
  },
  responses: {
    204: { description: 'The account is banned and its sessions are ended' },
    400: {
      description: 'The ban was refused',
      content: { 'application/json': { schema: AccountError } },
    },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
    404: {
      description: 'No such account',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const unbanAccountRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}/ban',
  tags: ['Accounts'],
  summary: 'Let a banned account sign in again',
  request: { params: z.object({ userId: z.string().min(1) }) },
  responses: {
    204: { description: 'The account may sign in again' },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
    404: {
      description: 'No such account',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const removeAccountRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}',
  tags: ['Accounts'],
  summary: 'Delete an account and everything it owns',
  request: { params: z.object({ userId: z.string().min(1) }) },
  responses: {
    204: { description: 'The account is gone' },
    400: {
      description: 'The removal was refused',
      content: { 'application/json': { schema: AccountError } },
    },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
    404: {
      description: 'No such account',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const inviteAccountRoute = createRoute({
  method: 'post',
  path: '/api/admin/accounts',
  tags: ['Accounts'],
  summary: 'Add an account, with a setup link for its owner or a password to hand over',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().trim().min(1).max(100),
            username: UsernameSchema.optional(),
            email: z.string().trim().email().optional(),
            password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(200).optional(),
            lifetimeDays: SetupLinkLifetimeSchema.optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description:
        'The account was created and given the default role, with its setup link when no password was given',
      content: {
        'application/json': {
          schema: z.object({
            account: Account,
            setupLink: IssuedSetupLinkSchema.openapi('SetupLink').nullable(),
          }),
        },
      },
    },
    400: {
      description: 'That username or address is already in use',
      content: { 'application/json': { schema: AccountError } },
    },
    500: {
      description: 'The account could not be created for another reason, which the log says',
      content: { 'application/json': { schema: AccountError } },
    },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const editAccountRoute = createRoute({
  method: 'patch',
  path: '/api/admin/accounts/{userId}',
  tags: ['Accounts'],
  summary: 'Change an account’s name, username or address',
  request: {
    params: z.object({ userId: z.string().min(1) }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().trim().min(1).max(100).optional(),
            username: UsernameSchema.optional(),
            email: z.string().trim().email().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    204: { description: 'The account was changed' },
    400: {
      description: 'The change was refused',
      content: { 'application/json': { schema: AccountError } },
    },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
    404: {
      description: 'No such account',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const resetAccountPasswordRoute = createRoute({
  method: 'put',
  path: '/api/admin/accounts/{userId}/password',
  tags: ['Accounts'],
  summary: 'Set an account’s password directly',
  request: {
    params: z.object({ userId: z.string().min(1) }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(200) }),
        },
      },
    },
  },
  responses: {
    204: { description: 'The password was changed and every session was ended' },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
    404: {
      description: 'No such account',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const AccountSession = z
  .object({
    id: z.string(),
    name: SaidSchema,
    address: z.string().nullable(),
    signedInAt: z.string(),
    expiresAt: z.string(),
  })
  .openapi('AccountSession');

const listAccountSessionsRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts/{userId}/sessions',
  tags: ['Accounts'],
  summary: 'See everywhere an account is signed in',
  request: { params: z.object({ userId: z.string().min(1) }) },
  responses: {
    200: {
      description: 'Where the account is signed in',
      content: { 'application/json': { schema: z.object({ sessions: z.array(AccountSession) }) } },
    },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const endAccountSessionsRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}/sessions',
  tags: ['Accounts'],
  summary: 'Sign an account out everywhere',
  request: { params: z.object({ userId: z.string().min(1) }) },
  responses: {
    204: { description: 'Every session was ended' },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const endAccountSessionRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}/sessions/{sessionId}',
  tags: ['Accounts'],
  summary: 'Sign one of an account’s sessions out',
  request: { params: z.object({ userId: z.string().min(1), sessionId: z.string().min(1) }) },
  responses: {
    204: { description: 'The session was ended' },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

const setAccountAvatarRoute = createRoute({
  method: 'patch',
  path: '/api/admin/accounts/{userId}/avatar',
  tags: ['Accounts'],
  summary: 'Give an account a drawn face, an initial, or a new colour',
  request: {
    params: z.object({ userId: z.string().min(1) }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            avatar: AvatarSchema.optional(),
            colour: ProfileColourSchema.optional(),
          }),
        },
      },
    },
  },
  responses: {
    204: { description: 'Changed' },
    403: {
      description: 'Not permitted',
      content: { 'application/json': { schema: AccountError } },
    },
    404: {
      description: 'No such account',
      content: { 'application/json': { schema: AccountError } },
    },
  },
});

export {
  listAccountsRoute,
  banAccountRoute,
  unbanAccountRoute,
  removeAccountRoute,
  inviteAccountRoute,
  editAccountRoute,
  resetAccountPasswordRoute,
  listAccountSessionsRoute,
  endAccountSessionsRoute,
  endAccountSessionRoute,
  setAccountAvatarRoute,
};
