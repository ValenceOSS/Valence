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
  QualityProfileChangeSchema,
  QualityProfileDraftSchema,
  QualityProfileSchema,
} from '@ValenceContracts/schemas/QualityProfile';
import {
  CatalogueSeasonSchema,
  MediaRequestAskSchema,
  MediaRequestChangeSchema,
  MediaRequestPickSchema,
  MediaRequestRefusalSchema,
  MediaRequestSchema,
  MissingSearchSchema,
  RequestLogEntrySchema,
} from '@ValenceContracts/schemas/MediaRequest';
import {
  DownloadFilingSchema,
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

const fileQueuedDownloadRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/downloads/{id}/file',
  tags: ['Admin'],
  summary: 'File a download into a library of films or series, now or once it has finished',
  request: {
    params: RecordIdParameter,
    body: { content: { 'application/json': { schema: DownloadFilingSchema } } },
  },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'The download, as it now is',
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

const QualityProfileAnswer = QualityProfileSchema.openapi('QualityProfile');

const listQualityProfilesRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests/profiles',
  tags: ['Admin'],
  summary: 'List the quality profiles searches are judged against',
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'Every profile',
      content: { 'application/json': { schema: z.array(QualityProfileAnswer) } },
    },
  }),
});

const addQualityProfileRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/profiles',
  tags: ['Admin'],
  summary: 'Add a quality profile',
  request: { body: { content: { 'application/json': { schema: QualityProfileDraftSchema } } } },
  responses: failures({
    ...REFUSED_BODY,
    201: {
      description: 'The profile, as kept',
      content: { 'application/json': { schema: QualityProfileAnswer } },
    },
  }),
});

const changeQualityProfileRoute = createRoute({
  method: 'patch',
  path: '/api/admin/requests/profiles/{id}',
  tags: ['Admin'],
  summary: 'Change a quality profile',
  request: {
    params: RecordIdParameter,
    body: { content: { 'application/json': { schema: QualityProfileChangeSchema } } },
  },
  responses: failures({
    ...REFUSED_BODY,
    200: {
      description: 'The profile, as changed',
      content: { 'application/json': { schema: QualityProfileAnswer } },
    },
  }),
});

const removeQualityProfileRoute = createRoute({
  method: 'delete',
  path: '/api/admin/requests/profiles/{id}',
  tags: ['Admin'],
  summary: 'Remove a quality profile',
  request: { params: RecordIdParameter },
  responses: failures({ ...REFUSED_BODY, 204: { description: 'Removed' } }),
});

const MediaRequestAnswer = MediaRequestSchema.openapi('MediaRequest');

/**
 * The failures every route onto somebody's requests can answer with, beside its own.
 *
 * @param extra - What else this route can answer.
 * @returns The responses.
 */
const requestFailures = <Extra extends object>(extra: Extra) => ({
  ...REFUSED_BODY,
  ...extra,
  403: {
    description: 'Not allowed to do this with requests',
    content: { 'application/json': { schema: RequestsError } },
  },
  404: {
    description: 'Requesting is off, or there is no such request',
    content: { 'application/json': { schema: RequestsError } },
  },
  502: {
    description: 'The requests service could not be heard',
    content: { 'application/json': { schema: RequestsError } },
  },
});

const ONE_REQUEST = {
  200: {
    description: 'The request, as it now is',
    content: { 'application/json': { schema: MediaRequestAnswer } },
  },
};

const listMediaRequestsRoute = createRoute({
  method: 'get',
  path: '/api/requests/media',
  tags: ['Requests'],
  summary:
    'List requests for films and series: everybody’s to those who approve, otherwise one’s own',
  responses: requestFailures({
    200: {
      description: 'The requests, newest first',
      content: { 'application/json': { schema: z.array(MediaRequestAnswer) } },
    },
  }),
});

const askForMediaRoute = createRoute({
  method: 'post',
  path: '/api/requests/media',
  tags: ['Requests'],
  summary: 'Ask for a film, or for a series or some of its seasons',
  request: { body: { content: { 'application/json': { schema: MediaRequestAskSchema } } } },
  responses: requestFailures({
    200: {
      description: 'It had been asked for already; this was added to that request',
      content: { 'application/json': { schema: MediaRequestAnswer } },
    },
    201: {
      description: 'The request, as made',
      content: { 'application/json': { schema: MediaRequestAnswer } },
    },
  }),
});

const seriesSeasonsRoute = createRoute({
  method: 'get',
  path: '/api/requests/catalogue/series/{tmdbId}/seasons',
  tags: ['Requests'],
  summary: 'List the seasons a series has, to choose which to ask for',
  request: {
    params: z.object({
      tmdbId: z.coerce
        .number()
        .int()
        .positive()
        .openapi({ param: { name: 'tmdbId', in: 'path' } }),
    }),
  },
  responses: requestFailures({
    200: {
      description: 'Its seasons, specials first, with how many episodes each holds',
      content: { 'application/json': { schema: z.array(CatalogueSeasonSchema) } },
    },
  }),
});

const searchMissingRoute = createRoute({
  method: 'post',
  path: '/api/requests/media/missing',
  tags: ['Requests'],
  summary: 'Search now for everything still wanted, and anything a profile would upgrade',
  responses: requestFailures({
    200: {
      description: 'How many requests were searched for',
      content: { 'application/json': { schema: MissingSearchSchema.openapi('MissingSearch') } },
    },
  }),
});

const changeMediaRequestRoute = createRoute({
  method: 'patch',
  path: '/api/requests/media/{id}',
  tags: ['Requests'],
  summary: 'Change the seasons a request asks for, or what a film waits for',
  request: {
    params: RecordIdParameter,
    body: { content: { 'application/json': { schema: MediaRequestChangeSchema } } },
  },
  responses: requestFailures(ONE_REQUEST),
});

const removeMediaRequestRoute = createRoute({
  method: 'delete',
  path: '/api/requests/media/{id}',
  tags: ['Requests'],
  summary: 'Forget a request, leaving whatever it fetched where it is',
  request: { params: RecordIdParameter },
  responses: requestFailures({ 204: { description: 'Forgotten' } }),
});

const approveMediaRequestRoute = createRoute({
  method: 'post',
  path: '/api/requests/media/{id}/approve',
  tags: ['Requests'],
  summary: 'Approve a request, so it is fetched',
  request: { params: RecordIdParameter },
  responses: requestFailures(ONE_REQUEST),
});

const refuseMediaRequestRoute = createRoute({
  method: 'post',
  path: '/api/requests/media/{id}/refuse',
  tags: ['Requests'],
  summary: 'Refuse a request, saying why where there is a reason worth giving',
  request: {
    params: RecordIdParameter,
    body: { content: { 'application/json': { schema: MediaRequestRefusalSchema } } },
  },
  responses: requestFailures(ONE_REQUEST),
});

const retryMediaRequestRoute = createRoute({
  method: 'post',
  path: '/api/requests/media/{id}/retry',
  tags: ['Requests'],
  summary: 'Try again whatever failed in a request, and search again for what is wanted',
  request: { params: RecordIdParameter },
  responses: requestFailures(ONE_REQUEST),
});

const mediaRequestReleasesRoute = createRoute({
  method: 'get',
  path: '/api/requests/media/{id}/releases',
  tags: ['Requests'],
  summary: 'Search for a request by hand, judging every release found',
  request: { params: RecordIdParameter },
  responses: requestFailures({
    200: {
      description: 'The releases for it, best first',
      content: { 'application/json': { schema: ReleaseSearchOutcomeSchema } },
    },
  }),
});

const mediaRequestLogRoute = createRoute({
  method: 'get',
  path: '/api/requests/media/{id}/log',
  tags: ['Requests'],
  summary: 'Read what a request has done: every search, what it found, and what became of it',
  request: { params: RecordIdParameter },
  responses: requestFailures({
    200: {
      description: 'What it did, newest first',
      content: { 'application/json': { schema: z.array(RequestLogEntrySchema) } },
    },
  }),
});

const pickMediaReleaseRoute = createRoute({
  method: 'post',
  path: '/api/requests/media/{id}/pick',
  tags: ['Requests'],
  summary: 'Fetch the release picked by hand for a request',
  request: {
    params: RecordIdParameter,
    body: { content: { 'application/json': { schema: MediaRequestPickSchema } } },
  },
  responses: requestFailures(ONE_REQUEST),
});

export {
  approveMediaRequestRoute,
  askForMediaRoute,
  changeMediaRequestRoute,
  listMediaRequestsRoute,
  mediaRequestLogRoute,
  mediaRequestReleasesRoute,
  pickMediaReleaseRoute,
  refuseMediaRequestRoute,
  removeMediaRequestRoute,
  retryMediaRequestRoute,
  searchMissingRoute,
  seriesSeasonsRoute,
  addQualityProfileRoute,
  changeQualityProfileRoute,
  listQualityProfilesRoute,
  removeQualityProfileRoute,
  addDownloadClientRoute,
  changeDownloadClientRoute,
  listDownloadClientsRoute,
  fileQueuedDownloadRoute,
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
