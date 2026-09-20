import { createRoute, z } from '@hono/zod-openapi';
import {
  RequestsAvailabilitySchema,
  RequestsOverviewSchema,
} from '@ValenceContracts/schemas/Requests';
import {
  IndexerCatalogueSchema,
  IndexerDefinitionDetailSchema,
} from '@ValenceContracts/schemas/IndexerDefinition';
import {
  IndexerChangeSchema,
  IndexerDraftSchema,
  IndexerSchema,
  IndexerTestSchema,
  ReleaseSearchOutcomeSchema,
  ReleaseSearchSchema,
} from '@ValenceContracts/schemas/Indexer';
import {
  DownloadClientChangeSchema,
  DownloadClientDraftSchema,
  DownloadClientSchema,
  DownloadClientTestSchema,
} from '@ValenceContracts/schemas/DownloadClient';
import {
  DownloadQueueSchema,
  QueuedDownloadSchema,
  ReleaseSendSchema,
} from '@ValenceContracts/schemas/DownloadQueue';

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

const DefinitionIdParameter = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: 'id', in: 'path' } }),
});

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

const listDefinitionsRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests/definitions',
  tags: ['Admin'],
  summary: 'List the sites Valence has definitions for',
  responses: failures({
    200: {
      description: 'Every definition in the catalogue, and how the catalogue last fared',
      content: {
        'application/json': { schema: IndexerCatalogueSchema.openapi('IndexerCatalogue') },
      },
    },
  }),
});

const refreshDefinitionsRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/definitions/refresh',
  tags: ['Admin'],
  summary: 'Fetch the definitions that changed since the catalogue was last brought up to date',
  responses: failures({
    200: {
      description: 'The catalogue, brought up to date where it could be',
      content: { 'application/json': { schema: IndexerCatalogueSchema } },
    },
  }),
});

const readDefinitionRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests/definitions/{id}',
  tags: ['Admin'],
  summary: 'Describe one definition, with the settings it asks for',
  request: { params: DefinitionIdParameter },
  responses: failures({
    200: {
      description: 'The definition',
      content: {
        'application/json': {
          schema: IndexerDefinitionDetailSchema.openapi('IndexerDefinitionDetail'),
        },
      },
    },
  }),
});

const DownloadClientAnswer = DownloadClientSchema.openapi('DownloadClient');

const DownloadClientTestAnswer = DownloadClientTestSchema.openapi('DownloadClientTest');

const QueuedDownloadAnswer = QueuedDownloadSchema.openapi('QueuedDownload');

const RecordIdParameter = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ param: { name: 'id', in: 'path' } }),
});

const listDownloadClientsRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests/clients',
  tags: ['Admin'],
  summary: 'List the download clients releases are sent to',
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'Every download client, without its password or key',
      content: { 'application/json': { schema: z.array(DownloadClientAnswer) } },
    },
  }),
});

const addDownloadClientRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/clients',
  tags: ['Admin'],
  summary: 'Add a qBittorrent, Transmission, SABnzbd or NZBGet client',
  request: { body: { content: { 'application/json': { schema: DownloadClientDraftSchema } } } },
  responses: failures({
    ...REFUSED_BODY,
    201: {
      description: 'The client, as kept',
      content: { 'application/json': { schema: DownloadClientAnswer } },
    },
  }),
});

const tryDownloadClientRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/clients/try',
  tags: ['Admin'],
  summary: 'Try a download client before keeping it',
  request: { body: { content: { 'application/json': { schema: DownloadClientDraftSchema } } } },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'Whether it answered, and which version it is',
      content: { 'application/json': { schema: DownloadClientTestAnswer } },
    },
  }),
});

const changeDownloadClientRoute = createRoute({
  method: 'patch',
  path: '/api/admin/requests/clients/{id}',
  tags: ['Admin'],
  summary: 'Change a download client',
  request: {
    params: RecordIdParameter,
    body: { content: { 'application/json': { schema: DownloadClientChangeSchema } } },
  },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'The client, as changed',
      content: { 'application/json': { schema: DownloadClientAnswer } },
    },
  }),
});

const removeDownloadClientRoute = createRoute({
  method: 'delete',
  path: '/api/admin/requests/clients/{id}',
  tags: ['Admin'],
  summary: 'Remove a download client, and stop following what was sent to it',
  request: { params: RecordIdParameter },
  responses: failures({ ...REFUSED_BODY, 204: { description: 'Removed' } }),
});

const testDownloadClientRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/clients/{id}/test',
  tags: ['Admin'],
  summary: 'Test a kept download client',
  request: { params: RecordIdParameter },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'Whether it answered, and which version it is',
      content: { 'application/json': { schema: DownloadClientTestAnswer } },
    },
  }),
});

const tryDownloadClientChangeRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/clients/{id}/try',
  tags: ['Admin'],
  summary: 'Try a change to a kept download client, with the password it already has',
  request: {
    params: RecordIdParameter,
    body: { content: { 'application/json': { schema: DownloadClientDraftSchema } } },
  },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'Whether it answered, and which version it is',
      content: { 'application/json': { schema: DownloadClientTestAnswer } },
    },
  }),
});

const readDownloadQueueRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests/downloads',
  tags: ['Admin'],
  summary: 'Read every download Valence has sent, and how each client is',
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'The queue',
      content: {
        'application/json': { schema: DownloadQueueSchema.openapi('DownloadQueue') },
      },
    },
  }),
});

const sendReleaseRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/downloads',
  tags: ['Admin'],
  summary: 'Send a release to a download client',
  request: { body: { content: { 'application/json': { schema: ReleaseSendSchema } } } },
  responses: failures({
    ...REFUSED_BODY,
    201: {
      description: 'The download, as sent',
      content: { 'application/json': { schema: QueuedDownloadAnswer } },
    },
  }),
});

const pauseQueuedDownloadRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/downloads/{id}/pause',
  tags: ['Admin'],
  summary: 'Pause a download in its client',
  request: { params: RecordIdParameter },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'The download, as its client now has it',
      content: { 'application/json': { schema: QueuedDownloadAnswer } },
    },
  }),
});

const resumeQueuedDownloadRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/downloads/{id}/resume',
  tags: ['Admin'],
  summary: 'Resume a download in its client',
  request: { params: RecordIdParameter },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'The download, as its client now has it',
      content: { 'application/json': { schema: QueuedDownloadAnswer } },
    },
  }),
});

const removeQueuedDownloadRoute = createRoute({
  method: 'delete',
  path: '/api/admin/requests/downloads/{id}',
  tags: ['Admin'],
  summary: 'Remove a download from its client, deleting what it downloaded where asked',
  request: {
    params: RecordIdParameter,
    query: z.object({
      deleteData: z
        .enum(['true', 'false'])
        .default('false')
        .openapi({ param: { name: 'deleteData', in: 'query' } }),
    }),
  },
  responses: failures({ ...REFUSED_BODY, 204: { description: 'Removed' } }),
});

export {
  addDownloadClientRoute,
  changeDownloadClientRoute,
  listDownloadClientsRoute,
  pauseQueuedDownloadRoute,
  readDownloadQueueRoute,
  removeDownloadClientRoute,
  removeQueuedDownloadRoute,
  resumeQueuedDownloadRoute,
  sendReleaseRoute,
  testDownloadClientRoute,
  tryDownloadClientChangeRoute,
  tryDownloadClientRoute,
  listDefinitionsRoute,
  readDefinitionRoute,
  refreshDefinitionsRoute,
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
