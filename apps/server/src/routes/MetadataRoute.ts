import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  TITLE_VALUE_FIELDS,
  TitleFilesSchema,
  TitlePageSchema,
  TitleValuesSchema,
  TitleCandidatesSchema,
} from '@ValenceContracts/schemas/TitleList';
import {
  TitleFieldSchema,
  MatchPreviewSchema,
  TitleEditOutcomeSchema,
  TitleEditRequestSchema,
  TitleHistorySchema,
  TitleMetadataSchema,
} from '@ValenceContracts/schemas/TitleEdit';

const Refusal = RefusalSchema.openapi('TitleMetadataRefusal');

const Params = z.object({ id: z.string().uuid() });

const Scope = z.object({ scope: z.enum(['title', 'season', 'episode']).default('title') });

const readTitleMetadataRoute = createRoute({
  method: 'get',
  path: '/api/media/{id}/metadata',
  tags: ['Library'],
  summary: 'Read the metadata of the film, programme, season or episode a file belongs to',
  request: { params: Params, query: Scope },
  responses: {
    200: {
      description: 'Each field, where its value came from, and what the catalogue says',
      content: { 'application/json': { schema: TitleMetadataSchema.openapi('TitleMetadata') } },
    },
    404: { description: 'No such file', content: { 'application/json': { schema: Refusal } } },
  },
});

const editTitleMetadataRoute = createRoute({
  method: 'patch',
  path: '/api/media/{id}/metadata',
  tags: ['Library'],
  summary: 'Set, lock or put back fields of a title, on every file of it',
  request: {
    params: Params,
    query: Scope,
    body: {
      content: {
        'application/json': { schema: TitleEditRequestSchema.openapi('TitleEditRequest') },
      },
    },
  },
  responses: {
    200: {
      description: 'The change, and the title as it now stands',
      content: {
        'application/json': { schema: TitleEditOutcomeSchema.openapi('TitleEditOutcome') },
      },
    },
    400: {
      description: 'A field the title does not have, or a value its rule refuses',
      content: { 'application/json': { schema: Refusal } },
    },
    404: { description: 'No such file', content: { 'application/json': { schema: Refusal } } },
  },
});

const readTitleHistoryRoute = createRoute({
  method: 'get',
  path: '/api/media/{id}/metadata/history',
  tags: ['Library'],
  summary: 'List the changes made to a title’s metadata, newest first',
  request: { params: Params, query: Scope },
  responses: {
    200: {
      description: 'The changes, each change set as one',
      content: { 'application/json': { schema: TitleHistorySchema.openapi('TitleHistory') } },
    },
    404: { description: 'No such file', content: { 'application/json': { schema: Refusal } } },
  },
});

const undoTitleChangeRoute = createRoute({
  method: 'post',
  path: '/api/media/{id}/metadata/history/{changeSetId}/undo',
  tags: ['Library'],
  summary: 'Undo a change to a title’s metadata',
  request: {
    params: Params.extend({ changeSetId: z.string().uuid() }),
    query: Scope,
  },
  responses: {
    200: {
      description: 'The title as it now stands',
      content: { 'application/json': { schema: TitleEditOutcomeSchema } },
    },
    404: {
      description: 'No such file or change',
      content: { 'application/json': { schema: Refusal } },
    },
    409: {
      description: 'A field the change set changed has been changed again since',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const previewMatchRoute = createRoute({
  method: 'get',
  path: '/api/media/{id}/match/preview',
  tags: ['Library'],
  summary: 'Compare a title, field by field, with the catalogue entry it would be matched to',
  request: {
    params: Params,
    query: z.object({ externalId: z.string().regex(/^\d+$/u), kind: z.enum(['tv', 'movie']) }),
  },
  responses: {
    200: {
      description: 'Each field the entry fills, as it stands and as it would be',
      content: { 'application/json': { schema: MatchPreviewSchema.openapi('MatchPreview') } },
    },
    404: {
      description: 'No such file, or no such entry in the catalogue',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const Reached = z
  .object({ corrected: z.number().int().nonnegative(), jobId: z.string().nullable() })
  .openapi('TitleWorkReached');

const refreshTitleRoute = createRoute({
  method: 'post',
  path: '/api/media/{id}/refresh',
  tags: ['Library'],
  summary: 'Ask the catalogue again for a title, for some of its fields, or for its artwork',
  request: {
    params: Params,
    body: {
      content: {
        'application/json': {
          schema: z
            .object({
              mode: z.enum(['details', 'fields', 'matchAgain', 'artwork']),
              fields: z.array(TitleFieldSchema).optional(),
            })
            .openapi('TitleRefreshRequest'),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'How many files or fields it reached, and the job doing the work, where one is',
      content: { 'application/json': { schema: Reached } },
    },
    400: {
      description: 'Fields were asked for again of a title that is not matched',
      content: { 'application/json': { schema: Refusal } },
    },
    404: { description: 'No such file', content: { 'application/json': { schema: Refusal } } },
  },
});

const unmatchTitleRoute = createRoute({
  method: 'post',
  path: '/api/media/{id}/unmatch',
  tags: ['Library'],
  summary: 'Take a title back to what its file names say, and keep it unmatched',
  request: { params: Params },
  responses: {
    200: {
      description: 'How many files it reached, and the job reading them again',
      content: { 'application/json': { schema: Reached } },
    },
    404: { description: 'No such file', content: { 'application/json': { schema: Refusal } } },
  },
});

const listTitlesRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles',
  tags: ['Library'],
  summary: 'List films and programmes, one row each however many files they are, a page at a time',
  request: {
    query: z.object({
      libraryId: z.string().optional(),
      sort: z.enum(['title', 'added']).default('title'),
      search: z.string().optional(),
      after: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(500).default(100),
    }),
  },
  responses: {
    200: {
      description: 'A page of titles, and where the next one starts',
      content: { 'application/json': { schema: TitlePageSchema.openapi('TitlePage') } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const listTitleValuesRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles/values',
  tags: ['Library'],
  summary: 'Count the genres, tags, studios or networks in use, for suggesting them',
  request: {
    query: z.object({ field: z.enum(TITLE_VALUE_FIELDS), libraryId: z.string().optional() }),
  },
  responses: {
    200: {
      description: 'Each word in use, and how many titles use it',
      content: { 'application/json': { schema: TitleValuesSchema.openapi('TitleValues') } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const findTitleCandidatesRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles/candidates',
  tags: ['Library'],
  summary: 'Find what a title might be in the catalogue, by name or by a pasted TMDB or IMDb id',
  request: {
    query: z.object({
      query: z.string().min(1),
      kind: z.enum(['tv', 'movie']),
      page: z.coerce.number().int().min(1).max(500).default(1),
    }),
  },
  responses: {
    200: {
      description: 'A page of what it might be, whether there is more, and how many in all',
      content: {
        'application/json': { schema: TitleCandidatesSchema.openapi('TitleCandidates') },
      },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const readTitleFilesRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles/{id}',
  tags: ['Library'],
  summary: 'Read every file of the film or programme one file belongs to',
  request: { params: Params },
  responses: {
    200: {
      description: 'The title’s files',
      content: { 'application/json': { schema: TitleFilesSchema.openapi('TitleFiles') } },
    },
    404: { description: 'No such file', content: { 'application/json': { schema: Refusal } } },
  },
});

export {
  listTitlesRoute,
  listTitleValuesRoute,
  findTitleCandidatesRoute,
  readTitleFilesRoute,
  refreshTitleRoute,
  unmatchTitleRoute,
  previewMatchRoute,
  readTitleMetadataRoute,
  editTitleMetadataRoute,
  readTitleHistoryRoute,
  undoTitleChangeRoute,
};
