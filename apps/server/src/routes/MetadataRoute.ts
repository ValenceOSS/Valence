import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
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

export {
  previewMatchRoute,
  readTitleMetadataRoute,
  editTitleMetadataRoute,
  readTitleHistoryRoute,
  undoTitleChangeRoute,
};
