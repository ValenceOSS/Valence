import { z } from 'zod';
import { TitleFieldSchema, TitleValueSchema } from './TitleEdit';

const BULK_TITLES_AT_ONCE = 500;

const LIST_FIELDS = ['genres', 'tags', 'studios', 'networks'] as const;

const ListFieldSchema = z.enum(LIST_FIELDS);

const BulkTargetSchema = z.object({
  mediaId: z.string().uuid(),
  scope: z.enum(['title', 'season', 'episode']),
});

const BulkTitleChangeSchema = z.object({
  set: z.partialRecord(TitleFieldSchema, TitleValueSchema).optional(),
  add: z.partialRecord(ListFieldSchema, z.array(z.string().trim().min(1).max(64))).optional(),
  remove: z.partialRecord(ListFieldSchema, z.array(z.string().trim().min(1).max(64))).optional(),
  clear: z.array(TitleFieldSchema).optional(),
  reset: z.array(TitleFieldSchema).optional(),
  lock: z.array(TitleFieldSchema).optional(),
  lockAll: z.boolean().optional(),
  unlockAll: z.boolean().optional(),
  sortTitleFromTitle: z.boolean().optional(),
  contentRating: z
    .object({
      region: z.string().regex(/^[A-Z]{2}$/u),
      rating: z.string().trim().min(1).max(16).nullable(),
    })
    .optional(),
});

const BulkTitleEditRequestSchema = z.object({
  targets: z.array(BulkTargetSchema).min(1).max(BULK_TITLES_AT_ONCE),
  appliesTo: z.enum(['titles', 'episodes']).default('titles'),
  change: BulkTitleChangeSchema,
  changeSetId: z.string().uuid().optional(),
});

const BulkTitleEditOutcomeSchema = z.object({
  changeSetId: z.string(),
  changed: z.array(BulkTargetSchema),
  unchanged: z.number().int().nonnegative(),
  refused: z.number().int().nonnegative(),
});

const BulkTitleReadRequestSchema = z.object({
  targets: z.array(BulkTargetSchema).min(1).max(BULK_TITLES_AT_ONCE),
  appliesTo: z.enum(['titles', 'episodes']).default('titles'),
});

const BulkFieldStateSchema = z.object({
  value: TitleValueSchema,
  isMixed: z.boolean(),
  titles: z.number().int().nonnegative(),
});

const BulkTitleFieldsSchema = z.object({
  titles: z.number().int().nonnegative(),
  fields: z.partialRecord(TitleFieldSchema, BulkFieldStateSchema),
  region: z.string().optional(),
});

const BulkTitleUndoRequestSchema = z.object({
  changeSetId: z.string().uuid(),
  targets: z.array(BulkTargetSchema).min(1).max(BULK_TITLES_AT_ONCE),
  undoSetId: z.string().uuid().optional(),
});

const BulkTitleUndoOutcomeSchema = z.object({
  changeSetId: z.string(),
  undone: z.number().int().nonnegative(),
});

type ListField = z.infer<typeof ListFieldSchema>;
type BulkTarget = z.infer<typeof BulkTargetSchema>;
type BulkTitleChange = z.infer<typeof BulkTitleChangeSchema>;
type BulkTitleEditRequest = z.infer<typeof BulkTitleEditRequestSchema>;
type BulkTitleEditOutcome = z.infer<typeof BulkTitleEditOutcomeSchema>;
type BulkTitleReadRequest = z.infer<typeof BulkTitleReadRequestSchema>;
type BulkFieldState = z.infer<typeof BulkFieldStateSchema>;
type BulkTitleFields = z.infer<typeof BulkTitleFieldsSchema>;
type BulkTitleUndoRequest = z.infer<typeof BulkTitleUndoRequestSchema>;
type BulkTitleUndoOutcome = z.infer<typeof BulkTitleUndoOutcomeSchema>;

export type {
  ListField,
  BulkTarget,
  BulkTitleChange,
  BulkTitleEditRequest,
  BulkTitleEditOutcome,
  BulkTitleReadRequest,
  BulkFieldState,
  BulkTitleFields,
  BulkTitleUndoRequest,
  BulkTitleUndoOutcome,
};

export {
  BULK_TITLES_AT_ONCE,
  LIST_FIELDS,
  ListFieldSchema,
  BulkTargetSchema,
  BulkTitleChangeSchema,
  BulkTitleEditRequestSchema,
  BulkTitleEditOutcomeSchema,
  BulkTitleReadRequestSchema,
  BulkFieldStateSchema,
  BulkTitleFieldsSchema,
  BulkTitleUndoRequestSchema,
  BulkTitleUndoOutcomeSchema,
};
