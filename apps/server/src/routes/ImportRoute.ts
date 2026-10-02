import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  ConnectMediaImportSchema,
  CreateImportLibrariesSchema,
  CreatedImportLibrariesSchema,
  ImportSetupLinksRequestSchema,
  ImportedSetupLinksSchema,
  LinkImportLibrarySchema,
  MediaImportDoneSchema,
  MediaImportLibrariesSchema,
  MediaImportPeopleSchema,
  MediaImportRunSchema,
  MediaImportSourceSchema,
  MediaImportStatusSchema,
  PathMappingsSchema,
  PlanMediaImportSchema,
  PlexPinSchema,
} from '@ValenceContracts/schemas/MediaImport';

const ImportRefusal = RefusalSchema.openapi('ImportRefusal');

const ImportRun = MediaImportRunSchema.openapi('MediaImportRun');

const ImportLibraries = MediaImportLibrariesSchema.openapi('MediaImportLibraries');

const SourceParams = z.object({ sourceId: z.string().uuid() });

const RunParams = z.object({ runId: z.string().uuid() });

const REFUSED = {
  403: {
    description: 'That is for administrators',
    content: { 'application/json': { schema: ImportRefusal } },
  },
  503: {
    description: 'This server was started without an importer',
    content: { 'application/json': { schema: ImportRefusal } },
  },
};

const NO_SOURCE = {
  404: {
    description: 'No such source',
    content: { 'application/json': { schema: ImportRefusal } },
  },
};

const UNREADABLE = {
  400: {
    description: 'The source could not be read',
    content: { 'application/json': { schema: ImportRefusal } },
  },
};

const NO_RUN = {
  404: {
    description: 'No such import',
    content: { 'application/json': { schema: ImportRefusal } },
  },
};

const importStatusRoute = createRoute({
  method: 'get',
  path: '/api/admin/imports',
  tags: ['Imports'],
  summary: 'List the servers connected to import from and the latest import from each',
  responses: {
    200: {
      description: 'The sources, their latest imports, and whether requesting can be imported too',
      content: {
        'application/json': { schema: MediaImportStatusSchema.openapi('MediaImportStatus') },
      },
    },
    ...REFUSED,
  },
});

const connectImportRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports',
  tags: ['Imports'],
  summary: 'Connect a Jellyfin, Emby or Plex server and check its key works',
  request: {
    body: {
      content: {
        'application/json': { schema: ConnectMediaImportSchema.openapi('ConnectMediaImport') },
      },
    },
  },
  responses: {
    201: {
      description: 'The server answered, and is kept to import from',
      content: {
        'application/json': { schema: MediaImportSourceSchema.openapi('MediaImportSource') },
      },
    },
    ...UNREADABLE,
    ...REFUSED,
  },
});

const forgetImportRoute = createRoute({
  method: 'delete',
  path: '/api/admin/imports/{sourceId}',
  tags: ['Imports'],
  summary: 'Forget a server connected to import from, and its imports',
  request: { params: SourceParams },
  responses: {
    200: {
      description: 'It was forgotten; what was imported stays',
      content: { 'application/json': { schema: MediaImportDoneSchema } },
    },
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const importPeopleRoute = createRoute({
  method: 'get',
  path: '/api/admin/imports/{sourceId}/people',
  tags: ['Imports'],
  summary: 'List the people on a source and whether their watching can be read',
  request: { params: SourceParams },
  responses: {
    200: {
      description: 'The people',
      content: {
        'application/json': { schema: MediaImportPeopleSchema.openapi('MediaImportPeople') },
      },
    },
    ...UNREADABLE,
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const importPinRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/{sourceId}/pins',
  tags: ['Imports'],
  summary: "Give a Plex Home member's PIN so their watching can be read",
  request: {
    params: SourceParams,
    body: { content: { 'application/json': { schema: PlexPinSchema.openapi('PlexPin') } } },
  },
  responses: {
    200: {
      description: 'The PIN worked; it is not kept',
      content: { 'application/json': { schema: MediaImportDoneSchema } },
    },
    ...UNREADABLE,
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const importLibrariesRoute = createRoute({
  method: 'get',
  path: '/api/admin/imports/{sourceId}/libraries',
  tags: ['Imports'],
  summary: "A source's libraries, where each folder is as Valence sees it, and which already exist",
  request: { params: SourceParams },
  responses: {
    200: {
      description: 'The libraries',
      content: { 'application/json': { schema: ImportLibraries } },
    },
    ...UNREADABLE,
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const importMappingsRoute = createRoute({
  method: 'put',
  path: '/api/admin/imports/{sourceId}/mappings',
  tags: ['Imports'],
  summary: "Say where a source's folders are as Valence sees them",
  request: {
    params: SourceParams,
    body: {
      content: { 'application/json': { schema: PathMappingsSchema.openapi('PathMappings') } },
    },
  },
  responses: {
    200: {
      description: 'The libraries, placed by the new mappings',
      content: { 'application/json': { schema: ImportLibraries } },
    },
    ...UNREADABLE,
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const linkImportLibraryRoute = createRoute({
  method: 'put',
  path: '/api/admin/imports/{sourceId}/library-links',
  tags: ['Imports'],
  summary: "Bring one of a source's folders into a library Valence already has",
  request: {
    params: SourceParams,
    body: {
      content: {
        'application/json': { schema: LinkImportLibrarySchema.openapi('LinkImportLibrary') },
      },
    },
  },
  responses: {
    200: {
      description: 'The libraries, with that folder now placed in the library chosen',
      content: { 'application/json': { schema: ImportLibraries } },
    },
    ...UNREADABLE,
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const createImportLibrariesRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/{sourceId}/libraries',
  tags: ['Imports'],
  summary: "Make Valence libraries for a source's folders and scan them",
  request: {
    params: SourceParams,
    body: {
      content: {
        'application/json': {
          schema: CreateImportLibrariesSchema.openapi('CreateImportLibraries'),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'What was made and the scan of each, or why a folder could not be used',
      content: {
        'application/json': {
          schema: CreatedImportLibrariesSchema.openapi('CreatedImportLibraries'),
        },
      },
    },
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const planImportRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/{sourceId}/plan',
  tags: ['Imports'],
  summary: 'Read everything on a source and report what an import would bring, writing nothing',
  request: {
    params: SourceParams,
    body: {
      content: { 'application/json': { schema: PlanMediaImportSchema.openapi('PlanMediaImport') } },
    },
  },
  responses: {
    202: {
      description: 'The plan is being made',
      content: { 'application/json': { schema: ImportRun } },
    },
    ...NO_SOURCE,
    ...REFUSED,
  },
});

const readImportRoute = createRoute({
  method: 'get',
  path: '/api/admin/imports/runs/{runId}',
  tags: ['Imports'],
  summary: 'How an import is getting on, and its report',
  request: { params: RunParams },
  responses: {
    200: { description: 'The import', content: { 'application/json': { schema: ImportRun } } },
    ...NO_RUN,
    ...REFUSED,
  },
});

const startImportRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/runs/{runId}/start',
  tags: ['Imports'],
  summary: 'Carry out a planned import, or run it again',
  request: { params: RunParams },
  responses: {
    202: {
      description: 'The import has started',
      content: { 'application/json': { schema: ImportRun } },
    },
    409: {
      description: 'It has not been planned yet, or is already running',
      content: { 'application/json': { schema: ImportRefusal } },
    },
    ...NO_RUN,
    ...REFUSED,
  },
});

const cancelImportRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/runs/{runId}/cancel',
  tags: ['Imports'],
  summary: 'Stop a plan or an import that is under way',
  request: { params: RunParams },
  responses: {
    200: {
      description: 'The import as it now stands',
      content: { 'application/json': { schema: ImportRun } },
    },
    ...NO_RUN,
    ...REFUSED,
  },
});

const importSetupLinksRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/runs/{runId}/setup-links',
  tags: ['Imports'],
  summary: 'Make a setup link for everybody an import added',
  request: {
    params: RunParams,
    body: {
      content: {
        'application/json': {
          schema: ImportSetupLinksRequestSchema.openapi('ImportSetupLinksRequest'),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Each new account and the link it signs in with the first time',
      content: {
        'application/json': { schema: ImportedSetupLinksSchema.openapi('ImportedSetupLinks') },
      },
    },
    ...NO_RUN,
    ...REFUSED,
  },
});

export {
  cancelImportRoute,
  connectImportRoute,
  createImportLibrariesRoute,
  forgetImportRoute,
  importLibrariesRoute,
  importMappingsRoute,
  importPeopleRoute,
  importPinRoute,
  importSetupLinksRoute,
  importStatusRoute,
  linkImportLibraryRoute,
  planImportRoute,
  readImportRoute,
  startImportRoute,
};
