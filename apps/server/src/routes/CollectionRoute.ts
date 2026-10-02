import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  AddCollectionEntriesSchema,
  CollectionDetailSchema,
  CollectionListSchema,
  CollectionSchema,
  CreateCollectionSchema,
  MoveCollectionEntrySchema,
  ReplaceCollectionEntriesSchema,
  UpdateCollectionSchema,
} from '@ValenceContracts/schemas/Collection';

const CollectionError = RefusalSchema.openapi('CollectionError');

const CollectionSummary = CollectionSchema.openapi('Collection');

const json = <Schema extends z.ZodType>(description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const NOT_SIGNED_IN = json('Nobody is signed in', CollectionError);

const NOT_ALLOWED = json(
  'Only somebody who may edit libraries may change collections',
  CollectionError,
);

const NOT_THERE = json('No such collection, or nothing in it you may see', CollectionError);

const COLLECTION_ID = z.object({ collectionId: z.string().uuid() });

const ENTRY_ID = z.object({ collectionId: z.string().uuid(), entryId: z.string().uuid() });

const changed = {
  401: NOT_SIGNED_IN,
  403: NOT_ALLOWED,
  404: NOT_THERE,
};

const listCollectionsRoute = createRoute({
  method: 'get',
  path: '/api/collections',
  tags: ['Collections'],
  summary: 'The collections holding something you may see, optionally only those holding one title',
  request: {
    query: z.object({
      mediaId: z.string().uuid().optional(),
      seriesId: z.string().uuid().optional(),
      withEmpty: z.enum(['true', 'false']).optional(),
    }),
  },
  responses: {
    200: json('The collections', CollectionListSchema.openapi('CollectionList')),
    401: NOT_SIGNED_IN,
  },
});

const createCollectionRoute = createRoute({
  method: 'post',
  path: '/api/collections',
  tags: ['Collections'],
  summary: 'Make a collection, optionally with films and programmes in it already',
  request: {
    body: { content: { 'application/json': { schema: CreateCollectionSchema } }, required: true },
  },
  responses: {
    201: json('The collection', CollectionSummary),
    401: NOT_SIGNED_IN,
    403: NOT_ALLOWED,
  },
});

const readCollectionRoute = createRoute({
  method: 'get',
  path: '/api/collections/{collectionId}',
  tags: ['Collections'],
  summary: 'Read a collection, leaving out anything you may not see',
  request: { params: COLLECTION_ID },
  responses: {
    200: json('The collection', CollectionDetailSchema.openapi('CollectionDetail')),
    401: NOT_SIGNED_IN,
    404: NOT_THERE,
  },
});

const updateCollectionRoute = createRoute({
  method: 'patch',
  path: '/api/collections/{collectionId}',
  tags: ['Collections'],
  summary: 'Rename or describe a collection, or say whether its order matters',
  request: {
    params: COLLECTION_ID,
    body: { content: { 'application/json': { schema: UpdateCollectionSchema } }, required: true },
  },
  responses: { 200: json('The collection', CollectionSummary), ...changed },
});

const removeCollectionRoute = createRoute({
  method: 'delete',
  path: '/api/collections/{collectionId}',
  tags: ['Collections'],
  summary: 'Delete a collection, leaving everything that was in it where it is',
  request: { params: COLLECTION_ID },
  responses: { 204: { description: 'Deleted' }, ...changed },
});

const addCollectionEntriesRoute = createRoute({
  method: 'post',
  path: '/api/collections/{collectionId}/entries',
  tags: ['Collections'],
  summary: 'Add films and programmes to the end of a collection, skipping any already in it',
  request: {
    params: COLLECTION_ID,
    body: {
      content: { 'application/json': { schema: AddCollectionEntriesSchema } },
      required: true,
    },
  },
  responses: { 200: json('How many were added', z.object({ added: z.number() })), ...changed },
});

const replaceCollectionEntriesRoute = createRoute({
  method: 'put',
  path: '/api/collections/{collectionId}/entries',
  tags: ['Collections'],
  summary: 'Replace everything in a collection with these, in this order',
  request: {
    params: COLLECTION_ID,
    body: {
      content: { 'application/json': { schema: ReplaceCollectionEntriesSchema } },
      required: true,
    },
  },
  responses: { 204: { description: 'Replaced' }, ...changed },
});

const moveCollectionEntryRoute = createRoute({
  method: 'patch',
  path: '/api/collections/{collectionId}/entries/{entryId}',
  tags: ['Collections'],
  summary: 'Move an entry to just after another, or to the top',
  request: {
    params: ENTRY_ID,
    body: {
      content: { 'application/json': { schema: MoveCollectionEntrySchema } },
      required: true,
    },
  },
  responses: { 204: { description: 'Moved' }, ...changed },
});

const dropCollectionEntryRoute = createRoute({
  method: 'delete',
  path: '/api/collections/{collectionId}/entries/{entryId}',
  tags: ['Collections'],
  summary: 'Take an entry out of a collection',
  request: { params: ENTRY_ID },
  responses: { 204: { description: 'Taken out' }, ...changed },
});

export {
  addCollectionEntriesRoute,
  createCollectionRoute,
  dropCollectionEntryRoute,
  listCollectionsRoute,
  moveCollectionEntryRoute,
  readCollectionRoute,
  removeCollectionRoute,
  replaceCollectionEntriesRoute,
  updateCollectionRoute,
};
