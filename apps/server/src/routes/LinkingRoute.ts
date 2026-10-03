import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  LinkIdentityChangeSchema,
  LinkIdentitySchema,
  LinkedServerSchema,
  LinkingSchema,
  MadeLinkInviteSchema,
  UseLinkInviteSchema,
} from '@ValenceContracts/schemas/LinkedServer';

const LinkingError = RefusalSchema.openapi('LinkingError');

const LinkedServer = LinkedServerSchema.openapi('LinkedServer');

const IdParams = z.object({ id: z.string().uuid() });

/**
 * Describes a refusal one of these routes answers with.
 *
 * @param description - What the refusal means.
 * @returns The response's description.
 */
const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: LinkingError } },
});

/**
 * Describes an answer that is one linked server.
 *
 * @param description - What the answer is.
 * @returns The response's description.
 */
const aServer = (description: string) => ({
  description,
  content: { 'application/json': { schema: LinkedServer } },
});

const linkingRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers',
  tags: ['Linked servers'],
  summary: 'This server’s identity, its open invites and the servers it is linked with',
  responses: {
    200: {
      description: 'Everything about linking',
      content: { 'application/json': { schema: LinkingSchema.openapi('Linking') } },
    },
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
  },
});

const changeIdentityRoute = createRoute({
  method: 'patch',
  path: '/api/linked-servers/identity',
  tags: ['Linked servers'],
  summary: 'Change what this server is called, its colour, or where it is reached',
  request: { body: { content: { 'application/json': { schema: LinkIdentityChangeSchema } } } },
  responses: {
    200: {
      description: 'The identity as it now is',
      content: { 'application/json': { schema: LinkIdentitySchema.openapi('LinkIdentity') } },
    },
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
  },
});

const makeInviteRoute = createRoute({
  method: 'post',
  path: '/api/linked-servers/invites',
  tags: ['Linked servers'],
  summary: 'Make an invite for another server’s admin, good once for a day',
  responses: {
    201: {
      description: 'The invite, shown this once',
      content: { 'application/json': { schema: MadeLinkInviteSchema.openapi('MadeLinkInvite') } },
    },
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
  },
});

const withdrawInviteRoute = createRoute({
  method: 'delete',
  path: '/api/linked-servers/invites/{id}',
  tags: ['Linked servers'],
  summary: 'Withdraw an open invite',
  request: { params: IdParams },
  responses: {
    204: { description: 'Withdrawn' },
    404: refused('No such open invite'),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
  },
});

const useInviteRoute = createRoute({
  method: 'post',
  path: '/api/linked-servers',
  tags: ['Linked servers'],
  summary: 'Link with the server another admin invited this one to',
  request: { body: { content: { 'application/json': { schema: UseLinkInviteSchema } } } },
  responses: {
    201: aServer('The server, waiting for its admin to approve, or linked'),
    400: refused('That is not an invite, or it has been used or has run out'),
    409: refused('Already linked with that server, or it is this one'),
    502: refused('That server could not be reached, or is not the one that made the invite'),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
  },
});

/**
 * Describes a route that acts on one linked server.
 *
 * @param path - Where it is, after the server's id.
 * @param summary - What it does.
 * @returns The route.
 */
const actOnServer = (path: string, summary: string) =>
  createRoute({
    method: 'post',
    path: `/api/linked-servers/{id}/${path}`,
    tags: ['Linked servers'],
    summary,
    request: { params: IdParams },
    responses: {
      200: aServer('The server as it now stands'),
      404: refused('No such server'),
      401: refused('Not signed in'),
      403: refused('Not allowed to link this server with others'),
    },
  });

const approveRoute = actOnServer('approve', 'Approve a server’s request to link');

const refuseRoute = actOnServer('refuse', 'Refuse a server’s request to link');

const checkRoute = actOnServer('check', 'Ask a server whether it has answered the request to link');

const unlinkServerRoute = createRoute({
  method: 'delete',
  path: '/api/linked-servers/{id}',
  tags: ['Linked servers'],
  summary: 'Unlink from a server, or forget one that refused or unlinked',
  request: { params: IdParams },
  responses: {
    204: { description: 'Unlinked' },
    404: refused('No such server'),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
  },
});

export {
  approveRoute,
  changeIdentityRoute,
  checkRoute,
  linkingRoute,
  makeInviteRoute,
  refuseRoute,
  unlinkServerRoute,
  useInviteRoute,
  withdrawInviteRoute,
};
