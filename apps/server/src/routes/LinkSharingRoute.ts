import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  AskableElsewhereSchema,
  FederationActivityListSchema,
  LinkedServerFacesSchema,
  LinkSharingChangeSchema,
  LinkSharingSchema,
  RemotePeopleSchema,
  RemotePersonSchema,
  TheirActivitySchema,
  TheirLibrariesSchema,
  TheirLibraryChoiceSchema,
} from '@ValenceContracts/schemas/LinkSharing';

const LinkSharingError = RefusalSchema.openapi('LinkSharingError');

const LinkSharing = LinkSharingSchema.openapi('LinkSharing');

const RemotePerson = RemotePersonSchema.openapi('RemotePerson');

const IdParams = z.object({ id: z.string().uuid() });

const LibraryParams = z.object({ id: z.string().uuid(), libraryId: z.string().uuid() });

const PersonParams = z.object({ id: z.string().uuid(), personId: z.string().uuid() });

/**
 * Describes a refusal one of these routes answers with.
 *
 * @param description - What the refusal means.
 * @returns The response's description.
 */
const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: LinkSharingError } },
});

/**
 * Describes a good answer.
 *
 * @param description - What the answer is.
 * @param schema - Its shape.
 * @returns The response's description.
 */
const answered = <Schema extends z.ZodType>(description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const readSharingRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers/{id}/sharing',
  tags: ['Linked servers'],
  summary: 'What this server shares with a linked server',
  request: { params: IdParams },
  responses: {
    200: answered('The libraries, age and settings it is shared', LinkSharing),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server'),
  },
});

const changeSharingRoute = createRoute({
  method: 'patch',
  path: '/api/linked-servers/{id}/sharing',
  tags: ['Linked servers'],
  summary: 'Change what this server shares with a linked server',
  request: {
    params: IdParams,
    body: { content: { 'application/json': { schema: LinkSharingChangeSchema } } },
  },
  responses: {
    200: answered('What it is shared now', LinkSharing),
    400: refused('One of the libraries is not on this server'),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server'),
  },
});

const remotePeopleRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers/{id}/people',
  tags: ['Linked servers'],
  summary: 'The people from a linked server this one has seen',
  request: { params: IdParams },
  responses: {
    200: answered(
      'The people, most recently seen first',
      RemotePeopleSchema.openapi('RemotePeople'),
    ),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server'),
  },
});

const blockPersonRoute = createRoute({
  method: 'put',
  path: '/api/linked-servers/{id}/people/{personId}/block',
  tags: ['Linked servers'],
  summary: 'Block one person from a linked server',
  request: { params: PersonParams },
  responses: {
    200: answered('The person, blocked', RemotePerson),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such person from that server'),
  },
});

const unblockPersonRoute = createRoute({
  method: 'delete',
  path: '/api/linked-servers/{id}/people/{personId}/block',
  tags: ['Linked servers'],
  summary: 'Let a blocked person from a linked server back in',
  request: { params: PersonParams },
  responses: {
    200: answered('The person, no longer blocked', RemotePerson),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such person from that server'),
  },
});

const activityRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers/{id}/activity',
  tags: ['Linked servers'],
  summary: 'What a linked server and its people asked this one for, and how it was answered',
  request: { params: IdParams },
  responses: {
    200: answered('The record, newest first', FederationActivityListSchema.openapi('LinkActivity')),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server'),
  },
});

const theirLibrariesRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers/{id}/their-libraries',
  tags: ['Linked servers'],
  summary: 'What a linked server shares with this one, asked of it now',
  request: { params: IdParams },
  responses: {
    200: answered(
      'Its libraries, or that it could not be reached',
      TheirLibrariesSchema.openapi('TheirLibraries'),
    ),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server'),
  },
});

const chooseTheirLibraryRoute = createRoute({
  method: 'put',
  path: '/api/linked-servers/{id}/their-libraries/{libraryId}',
  tags: ['Linked servers'],
  summary: 'Take one library a linked server shares into this one, or leave it out',
  request: {
    params: LibraryParams,
    body: { content: { 'application/json': { schema: TheirLibraryChoiceSchema } } },
  },
  responses: {
    200: answered(
      'Whether it is taken now',
      TheirLibraryChoiceSchema.openapi('TheirLibraryChoice'),
    ),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server'),
  },
});

const theirActivityRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers/{id}/their-activity',
  tags: ['Linked servers'],
  summary: 'A linked server’s record of this one’s people, where its admin shows it',
  request: { params: IdParams },
  responses: {
    200: answered('Its record, or why there is none', TheirActivitySchema.openapi('TheirActivity')),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server'),
  },
});

const syncRoute = createRoute({
  method: 'post',
  path: '/api/linked-servers/{id}/sync',
  tags: ['Linked servers'],
  summary: 'Read what a linked server shares with this one again, now',
  request: { params: IdParams },
  responses: {
    200: answered(
      'How many libraries and titles were read, and how many had gone',
      z
        .object({
          libraries: z.number().int().nonnegative(),
          kept: z.number().int().nonnegative(),
          forgotten: z.number().int().nonnegative(),
        })
        .openapi('LinkSync'),
    ),
    401: refused('Not signed in'),
    403: refused('Not allowed to link this server with others'),
    404: refused('No such linked server, or it could not be reached'),
  },
});

const facesRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers/faces',
  tags: ['Linked servers'],
  summary: 'The servers this one is linked with, as anybody here sees them beside what they share',
  responses: {
    200: answered(
      'Each linked server’s name and colour, and whether it can be reached',
      LinkedServerFacesSchema.openapi('LinkedServerFaces'),
    ),
    401: refused('Not signed in'),
  },
});

const askableRoute = createRoute({
  method: 'get',
  path: '/api/linked-servers/people',
  tags: ['Linked servers'],
  summary: 'People from linked servers who have watched here, who can be asked along to a party',
  responses: {
    200: answered(
      'Each by an id to ask them along by, and their name with their server',
      AskableElsewhereSchema.openapi('AskableElsewhere'),
    ),
    401: refused('Not signed in'),
  },
});

export {
  askableRoute,
  facesRoute,
  syncRoute,
  activityRoute,
  blockPersonRoute,
  changeSharingRoute,
  chooseTheirLibraryRoute,
  readSharingRoute,
  remotePeopleRoute,
  theirActivityRoute,
  theirLibrariesRoute,
  unblockPersonRoute,
};
