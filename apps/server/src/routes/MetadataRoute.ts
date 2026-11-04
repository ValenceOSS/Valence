import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  TITLE_VALUE_FIELDS,
  LibraryProblemsSchema,
  TitleChoicesSchema,
  TitleFilesSchema,
  TitleKeysSchema,
  TitleListQuerySchema,
  TitlePageSchema,
  TitleValuesSchema,
  TitleCandidatesSchema,
} from '@ValenceContracts/schemas/TitleList';
import {
  AttachOrphanRequestSchema,
  ForgetOrphanRequestSchema,
  OrphanOutcomeSchema,
  OrphanedEditsSchema,
} from '@ValenceContracts/schemas/OrphanedEdits';
import {
  BulkTitleEditOutcomeSchema,
  BulkTitleEditRequestSchema,
  BulkTitleFieldsSchema,
  BulkTitleReadRequestSchema,
  BulkTitleUndoOutcomeSchema,
  BulkTitleUndoRequestSchema,
} from '@ValenceContracts/schemas/BulkTitleEdit';
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
              mode: z.enum(['details', 'fields', 'matchAgain', 'artwork', 'files']),
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
  summary:
    'List a library’s films and programmes, one row each however many files they are, searched, filtered and put in order on the server, a page at a time',
  request: {
    query: TitleListQuerySchema.extend({
      after: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(500).default(100),
    }),
  },
  responses: {
    200: {
      description:
        'A page of titles, where the next one starts, and how many each quick filter shows',
      content: { 'application/json': { schema: TitlePageSchema.openapi('TitlePage') } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const listTitleKeysRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles/keys',
  tags: ['Library'],
  summary: 'Name every title a listing asks for, for selecting all of them',
  request: { query: TitleListQuerySchema },
  responses: {
    200: {
      description: 'Every title the listing asks for',
      content: { 'application/json': { schema: TitleKeysSchema.openapi('TitleKeys') } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const listTitleChoicesRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles/choices',
  tags: ['Library'],
  summary: 'Say what a library’s filters can be set to, with how many titles each shows',
  request: { query: z.object({ libraryId: z.string().min(1) }) },
  responses: {
    200: {
      description: 'The values of each filter',
      content: { 'application/json': { schema: TitleChoicesSchema.openapi('TitleChoices') } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const countLibraryProblemsRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles/problems',
  tags: ['Library'],
  summary: 'Count the titles in each library that need a look',
  responses: {
    200: {
      description: 'How many titles in each library need a look',
      content: {
        'application/json': { schema: LibraryProblemsSchema.openapi('LibraryProblems') },
      },
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
  summary: 'Read every file of the film or programme one file belongs to, with where each is',
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: {
      description: 'The title’s files',
      content: { 'application/json': { schema: TitleFilesSchema.openapi('TitleFiles') } },
    },
    404: { description: 'No such file', content: { 'application/json': { schema: Refusal } } },
  },
});

const readTitlesTogetherRoute = createRoute({
  method: 'post',
  path: '/api/admin/titles/bulk/read',
  tags: ['Library'],
  summary: 'Read how the fields of many titles stand together, saying where they differ',
  request: {
    body: {
      content: {
        'application/json': { schema: BulkTitleReadRequestSchema.openapi('BulkTitleReadRequest') },
      },
    },
  },
  responses: {
    200: {
      description: 'How many titles, and each field’s shared value or that it differs',
      content: { 'application/json': { schema: BulkTitleFieldsSchema.openapi('BulkTitleFields') } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const editTitlesTogetherRoute = createRoute({
  method: 'post',
  path: '/api/admin/titles/bulk',
  tags: ['Library'],
  summary: 'Make one change to the metadata of many titles, kept as one change set',
  request: {
    body: {
      content: {
        'application/json': { schema: BulkTitleEditRequestSchema.openapi('BulkTitleEditRequest') },
      },
    },
  },
  responses: {
    200: {
      description: 'The change set, and which titles it changed',
      content: {
        'application/json': { schema: BulkTitleEditOutcomeSchema.openapi('BulkTitleEditOutcome') },
      },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const undoTitlesTogetherRoute = createRoute({
  method: 'post',
  path: '/api/admin/titles/bulk/undo',
  tags: ['Library'],
  summary: 'Undo a change made to many titles, every one of them or none',
  request: {
    body: {
      content: {
        'application/json': { schema: BulkTitleUndoRequestSchema.openapi('BulkTitleUndoRequest') },
      },
    },
  },
  responses: {
    200: {
      description: 'The undoing’s change set, and how many titles it put back',
      content: {
        'application/json': { schema: BulkTitleUndoOutcomeSchema.openapi('BulkTitleUndoOutcome') },
      },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
    409: {
      description: 'A title was changed again since',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const listOrphanedEditsRoute = createRoute({
  method: 'get',
  path: '/api/admin/titles/orphans',
  tags: ['Library'],
  summary: 'List the titles of a library whose edits are kept though their files have gone',
  request: { query: z.object({ libraryId: z.string().min(1) }) },
  responses: {
    200: {
      description: 'The titles gone, with what is kept for each',
      content: { 'application/json': { schema: OrphanedEditsSchema.openapi('OrphanedEdits') } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const attachOrphanedEditsRoute = createRoute({
  method: 'post',
  path: '/api/admin/titles/orphans/attach',
  tags: ['Library'],
  summary: 'Move the edits of a title that has gone onto one still there',
  request: {
    body: {
      content: {
        'application/json': { schema: AttachOrphanRequestSchema.openapi('AttachOrphanRequest') },
      },
    },
  },
  responses: {
    200: {
      description: 'How many edits moved',
      content: { 'application/json': { schema: OrphanOutcomeSchema.openapi('OrphanOutcome') } },
    },
    404: {
      description: 'Not for this account, or no such title',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

const forgetOrphanedEditsRoute = createRoute({
  method: 'post',
  path: '/api/admin/titles/orphans/forget',
  tags: ['Library'],
  summary: 'Throw away the edits of a title that has gone',
  request: {
    body: {
      content: {
        'application/json': { schema: ForgetOrphanRequestSchema.openapi('ForgetOrphanRequest') },
      },
    },
  },
  responses: {
    200: {
      description: 'How many edits went',
      content: { 'application/json': { schema: OrphanOutcomeSchema } },
    },
    404: {
      description: 'Not for this account',
      content: { 'application/json': { schema: Refusal } },
    },
  },
});

export {
  listOrphanedEditsRoute,
  attachOrphanedEditsRoute,
  forgetOrphanedEditsRoute,
  readTitlesTogetherRoute,
  editTitlesTogetherRoute,
  undoTitlesTogetherRoute,
  listTitlesRoute,
  listTitleKeysRoute,
  listTitleChoicesRoute,
  countLibraryProblemsRoute,
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
