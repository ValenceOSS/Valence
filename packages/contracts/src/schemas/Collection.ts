import { z } from 'zod';
import { MediaSummarySchema } from './Library';

const COLLECTION_ENTRY_KINDS = ['film', 'series'] as const;

const COLLECTION_ORDERS = ['position', 'year', 'title'] as const;

const MOST_COLLECTION_ENTRIES = 1000;

const CollectionEntryKindSchema = z.enum(COLLECTION_ENTRY_KINDS);

const CollectionOrderSchema = z.enum(COLLECTION_ORDERS);

const CollectionSubjectSchema = z.union([
  z.strictObject({ mediaItemId: z.string().min(1) }),
  z.strictObject({ seriesId: z.string().min(1) }),
]);

const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).nullable(),
  isOrdered: z.boolean(),
  hasOwnArtwork: z.boolean(),
  entryCount: z.number().int().nonnegative(),
  coverMediaIds: z.array(z.string()).max(4),
  updatedAt: z.string(),
});

const CollectionEntrySchema = z.object({
  id: z.string().uuid(),
  position: z.number(),
  addedAt: z.string(),
  kind: CollectionEntryKindSchema,
  media: MediaSummarySchema,
});

const CollectionDetailSchema = z.object({
  collection: CollectionSchema,
  entries: z.array(CollectionEntrySchema),
});

const CollectionListSchema = z.object({ collections: z.array(CollectionSchema) });

const CreateCollectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).nullish(),
  isOrdered: z.boolean().optional(),
  entries: z.array(CollectionSubjectSchema).max(MOST_COLLECTION_ENTRIES).optional(),
});

const UpdateCollectionSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  isOrdered: z.boolean().optional(),
});

const AddCollectionEntriesSchema = z.object({
  entries: z.array(CollectionSubjectSchema).min(1).max(MOST_COLLECTION_ENTRIES),
});

const ReplaceCollectionEntriesSchema = z.object({
  entries: z.array(CollectionSubjectSchema).max(MOST_COLLECTION_ENTRIES),
});

const MoveCollectionEntrySchema = z.object({
  afterEntryId: z.string().uuid().nullable(),
});

type CollectionEntryKind = z.infer<typeof CollectionEntryKindSchema>;
type CollectionOrder = z.infer<typeof CollectionOrderSchema>;
type CollectionSubject = z.infer<typeof CollectionSubjectSchema>;
type Collection = z.infer<typeof CollectionSchema>;
type CollectionEntry = z.infer<typeof CollectionEntrySchema>;
type CollectionDetail = z.infer<typeof CollectionDetailSchema>;
type CreateCollection = z.infer<typeof CreateCollectionSchema>;
type UpdateCollection = z.infer<typeof UpdateCollectionSchema>;

export type {
  Collection,
  CollectionDetail,
  CollectionEntry,
  CollectionEntryKind,
  CollectionOrder,
  CollectionSubject,
  CreateCollection,
  UpdateCollection,
};

export {
  AddCollectionEntriesSchema,
  COLLECTION_ENTRY_KINDS,
  COLLECTION_ORDERS,
  CollectionDetailSchema,
  CollectionEntryKindSchema,
  CollectionEntrySchema,
  CollectionListSchema,
  CollectionOrderSchema,
  CollectionSchema,
  CollectionSubjectSchema,
  CreateCollectionSchema,
  MOST_COLLECTION_ENTRIES,
  MoveCollectionEntrySchema,
  ReplaceCollectionEntriesSchema,
  UpdateCollectionSchema,
};
