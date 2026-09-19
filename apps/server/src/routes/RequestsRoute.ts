import { createRoute, z } from '@hono/zod-openapi';
import {
  RequestsAvailabilitySchema,
  RequestsOverviewSchema,
} from '@ValenceContracts/schemas/Requests';
import {
  IndexerChangeSchema,
  IndexerDraftSchema,
  IndexerSchema,
  IndexerTestSchema,
  ReleaseSearchOutcomeSchema,
  ReleaseSearchSchema,
} from '@ValenceContracts/schemas/Indexer';

const RequestsError = z.object({ error: z.string() }).openapi('RequestsError');

const RequestsAvailabilityAnswer = RequestsAvailabilitySchema.openapi('RequestsAvailability');

const RequestsOverviewAnswer = RequestsOverviewSchema.openapi('RequestsOverview');

const requestsAvailabilityRoute = createRoute({
  method: 'get',
  path: '/api/requests/availability',
  tags: ['Requests'],
  summary: 'Say whether this server takes requests at all',
  responses: {
    200: {
      description: 'Whether the requests service is set up',
      content: { 'application/json': { schema: RequestsAvailabilityAnswer } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: RequestsError } },
    },
  },
});

const adminRequestsOverviewRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests',
  tags: ['Admin'],
  summary: 'Read what the server last heard from the requests service',
  responses: {
    200: {
      description: 'Where the service is, whether it answered, and how its VPN is',
      content: { 'application/json': { schema: RequestsOverviewAnswer } },
    },
    403: {
      description: 'Not allowed to manage requesting',
      content: { 'application/json': { schema: RequestsError } },
    },
    404: {
      description: 'Requesting is off',
      content: { 'application/json': { schema: RequestsError } },
    },
  },
});

const adminCheckRequestsRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/check',
  tags: ['Admin'],
  summary: 'Ask the requests service how it is, now',
  responses: {
    200: {
      description: 'What it said',
      content: { 'application/json': { schema: RequestsOverviewAnswer } },
    },
    403: {
      description: 'Not allowed to manage requesting',
      content: { 'application/json': { schema: RequestsError } },
    },
    404: {
      description: 'Requesting is off',
      content: { 'application/json': { schema: RequestsError } },
    },
  },
});

const IndexerAnswer = IndexerSchema.openapi('Indexer');

const IndexerTestAnswer = IndexerTestSchema.openapi('IndexerTest');

const IndexerIdParameter = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ param: { name: 'id', in: 'path' } }),
});

/**
 * The failures every route onto the requests service can answer with, beside its own.
 *
 * @param extra - What else this route can answer.
 * @returns The responses.
 */
const failures = <Extra extends object>(extra: Extra) => ({
  ...extra,
  403: {
    description: 'Not allowed to manage requesting',
    content: { 'application/json': { schema: RequestsError } },
  },
  404: {
    description: 'Requesting is off, or there is no such indexer',
    content: { 'application/json': { schema: RequestsError } },
  },
  502: {
    description: 'The requests service could not be heard',
    content: { 'application/json': { schema: RequestsError } },
  },
});

const REFUSED_BODY = {
  400: {
    description: 'That is not what this takes',
    content: { 'application/json': { schema: RequestsError } },
  },
};

const listIndexersRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests/indexers',
  tags: ['Admin'],
  summary: 'List the indexers requesting searches',
  responses: failures({
    200: {
      description: 'Every indexer, without its key',
      content: { 'application/json': { schema: z.array(IndexerAnswer) } },
    },
  }),
});

const addIndexerRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/indexers',
  tags: ['Admin'],
  summary: 'Add a Torznab or Newznab indexer',
  request: { body: { content: { 'application/json': { schema: IndexerDraftSchema } } } },
  responses: failures({
    ...REFUSED_BODY,
    201: {
      description: 'The indexer, as kept',
      content: { 'application/json': { schema: IndexerAnswer } },
    },
  }),
});

const tryIndexerRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/indexers/try',
  tags: ['Admin'],
  summary: 'Try an indexer before keeping it',
  request: { body: { content: { 'application/json': { schema: IndexerDraftSchema } } } },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'Whether it answered, and what it can search',
      content: { 'application/json': { schema: IndexerTestAnswer } },
    },
  }),
});

const changeIndexerRoute = createRoute({
  method: 'patch',
  path: '/api/admin/requests/indexers/{id}',
  tags: ['Admin'],
  summary: 'Change an indexer',
  request: {
    params: IndexerIdParameter,
    body: { content: { 'application/json': { schema: IndexerChangeSchema } } },
  },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'The indexer, as changed',
      content: { 'application/json': { schema: IndexerAnswer } },
    },
  }),
});

const removeIndexerRoute = createRoute({
  method: 'delete',
  path: '/api/admin/requests/indexers/{id}',
  tags: ['Admin'],
  summary: 'Remove an indexer',
  request: { params: IndexerIdParameter },
  responses: failures({ 204: { description: 'Removed' } }),
});

const testIndexerRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/indexers/{id}/test',
  tags: ['Admin'],
  summary: 'Test a kept indexer, reading what it can search again',
  request: { params: IndexerIdParameter },
  responses: failures({
    200: {
      description: 'Whether it answered, and what it can search',
      content: { 'application/json': { schema: IndexerTestAnswer } },
    },
  }),
});

const tryIndexerChangeRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/indexers/{id}/try',
  tags: ['Admin'],
  summary: 'Try a change to a kept indexer before saving it, with the key it already has',
  request: {
    params: IndexerIdParameter,
    body: { content: { 'application/json': { schema: IndexerDraftSchema } } },
  },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'Whether it answered, and what it can search',
      content: { 'application/json': { schema: IndexerTestAnswer } },
    },
  }),
});

const searchReleasesRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/search',
  tags: ['Admin'],
  summary: 'Search every enabled indexer at once',
  request: { body: { content: { 'application/json': { schema: ReleaseSearchSchema } } } },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'What every indexer found, and what each said',
      content: {
        'application/json': { schema: ReleaseSearchOutcomeSchema.openapi('ReleaseSearchOutcome') },
      },
    },
  }),
});

export {
  addIndexerRoute,
  adminCheckRequestsRoute,
  adminRequestsOverviewRoute,
  changeIndexerRoute,
  listIndexersRoute,
  removeIndexerRoute,
  requestsAvailabilityRoute,
  searchReleasesRoute,
  testIndexerRoute,
  tryIndexerChangeRoute,
  tryIndexerRoute,
};
