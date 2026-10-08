import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import {
  IssuedSetupLinkSchema,
  SetupLinkDetailsSchema,
  SetupLinkLifetimeSchema,
  SetupRedemptionSchema,
} from '@ValenceContracts/schemas/SetupLink';

const SetupLink = IssuedSetupLinkSchema.openapi('SetupLink');

const SetupLinkError = RefusalSchema.openapi('SetupLinkError');

const SETUP_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

const TokenParams = z.object({ token: z.string().regex(SETUP_TOKEN_PATTERN) });

const AccountParams = z.object({ userId: z.string().min(1) });

/**
 * Describes a refusal one of these routes answers with.
 *
 * @param description - What the refusal means.
 * @returns The response's description.
 */
const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: SetupLinkError } },
});

const issueSetupLinkRoute = createRoute({
  method: 'post',
  path: '/api/admin/accounts/{userId}/setup-link',
  tags: ['Accounts'],
  summary: 'Make a new setup link for an account, replacing any it had',
  description:
    'For an account still waiting to be set up this is its way in; for one already in use it is a friendlier password reset. Any earlier link stops working.',
  request: {
    params: AccountParams,
    body: {
      content: {
        'application/json': { schema: z.object({ lifetimeDays: SetupLinkLifetimeSchema }) },
      },
    },
  },
  responses: {
    201: {
      description: 'The new link, shown once',
      content: { 'application/json': { schema: SetupLink } },
    },
    403: refused('Not permitted'),
    404: refused('No such account'),
  },
});

const revokeSetupLinkRoute = createRoute({
  method: 'delete',
  path: '/api/admin/accounts/{userId}/setup-link',
  tags: ['Accounts'],
  summary: 'Stop an account’s setup link working',
  request: { params: AccountParams },
  responses: {
    204: { description: 'The link no longer works' },
    403: refused('Not permitted'),
  },
});

const emailSetupLinkRoute = createRoute({
  method: 'post',
  path: '/api/admin/accounts/{userId}/setup-link/email',
  tags: ['Accounts'],
  summary: 'Email an account its setup link',
  description:
    'Sends the link just made, when its token is given, or else makes a new one and sends that.',
  request: {
    params: AccountParams,
    body: {
      content: {
        'application/json': {
          schema: z.object({
            token: z.string().regex(SETUP_TOKEN_PATTERN).optional(),
            lifetimeDays: SetupLinkLifetimeSchema.optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'The link that was sent',
      content: { 'application/json': { schema: SetupLink } },
    },
    400: refused('Email is off, or the account has no address'),
    403: refused('Not permitted'),
    404: refused('No such account'),
    502: refused('The mail server would not take it'),
  },
});

const usernameAvailableRoute = createRoute({
  method: 'get',
  path: '/api/admin/accounts/username-available',
  tags: ['Accounts'],
  summary: 'Whether a username is free for an account to take',
  request: {
    query: z.object({ username: z.string().min(1).max(100), userId: z.string().optional() }),
  },
  responses: {
    200: {
      description: 'Whether it is free',
      content: { 'application/json': { schema: z.object({ isAvailable: z.boolean() }) } },
    },
    403: refused('Not permitted'),
  },
});

const readSetupLinkRoute = createRoute({
  method: 'get',
  path: '/api/setup-links/{token}',
  tags: ['Setup links'],
  summary: 'What a setup link’s owner still has to choose',
  request: { params: TokenParams },
  responses: {
    200: {
      description: 'The account the link sets up',
      content: {
        'application/json': { schema: SetupLinkDetailsSchema.openapi('SetupLinkDetails') },
      },
    },
    404: refused('The link is unknown, used, revoked or out of date'),
  },
});

const redeemSetupLinkRoute = createRoute({
  method: 'post',
  path: '/api/setup-links/{token}',
  tags: ['Setup links'],
  summary: 'Finish setting an account up and sign its owner in',
  description:
    'Spends the link. With a password it is set as the account’s password; without one, the owner is signed in to make a passkey.',
  request: {
    params: TokenParams,
    body: { content: { 'application/json': { schema: SetupRedemptionSchema } } },
  },
  responses: {
    200: {
      description: 'The account is set up, and its owner signed in unless it has a second factor',
      content: { 'application/json': { schema: z.object({ isSignedIn: z.boolean() }) } },
    },
    400: refused('A username or address was taken, or a username is needed'),
    404: refused('The link is unknown, used, revoked or out of date'),
  },
});

const firstPasswordRoute = createRoute({
  method: 'post',
  path: '/api/setup-links/password',
  tags: ['Setup links'],
  summary: 'Give an account set up without a password its first one',
  description:
    'For somebody who set up with a passkey, from the setup page when the passkey failed or later from their security settings. Refused for an account that already has a password.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(200) }),
        },
      },
    },
  },
  responses: {
    204: { description: 'The password is set' },
    400: refused('The account already has a password'),
    401: refused('Nobody is signed in'),
  },
});

export {
  SETUP_TOKEN_PATTERN,
  emailSetupLinkRoute,
  firstPasswordRoute,
  issueSetupLinkRoute,
  readSetupLinkRoute,
  redeemSetupLinkRoute,
  revokeSetupLinkRoute,
  usernameAvailableRoute,
};
