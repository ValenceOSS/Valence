import { z } from 'zod';

const TITLE_SUBJECT_KINDS = ['film', 'show', 'season', 'episode'] as const;

const TitleSubjectKindSchema = z.enum(TITLE_SUBJECT_KINDS);

const EARLIEST_YEAR = 1870;

const LATEST_YEAR = 2200;

const DaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((day) => {
    const [year = 0, month = 0, date = 0] = day.split('-').map(Number);
    const read = new Date(Date.UTC(year, month - 1, date));

    return (
      year >= EARLIEST_YEAR &&
      year <= LATEST_YEAR &&
      read.getUTCFullYear() === year &&
      read.getUTCMonth() === month - 1 &&
      read.getUTCDate() === date
    );
  });

const WordsSchema = z.array(z.string().trim().min(1).max(64)).max(64);

const CastEntrySchema = z.object({
  personId: z.number().int().positive().nullable(),
  name: z.string().trim().min(1).max(128),
  role: z.string().trim().max(128),
  imageUrl: z.string().max(2048).nullable(),
});

const TITLE_FIELD_SCHEMAS = {
  title: z.string().trim().min(1).max(512),
  sortTitle: z.string().trim().min(1).max(512).nullable(),
  originalTitle: z.string().trim().min(1).max(512).nullable(),
  tagline: z.string().trim().max(512).nullable(),
  overview: z.string().trim().max(8000).nullable(),
  releaseDate: DaySchema.nullable(),
  addedAt: DaySchema,
  status: z.string().trim().min(1).max(64).nullable(),
  genres: WordsSchema,
  tags: WordsSchema,
  studios: WordsSchema,
  networks: WordsSchema,
  certifications: z.record(z.string().regex(/^[A-Z]{2}$/), z.string().trim().min(1).max(16)),
  rating: z.number().min(0).max(10).nullable(),
  rottenTomatoes: z.number().int().min(0).max(100).nullable(),
  imdbId: z
    .string()
    .regex(/^tt\d{5,10}$/)
    .nullable(),
  tvdbId: z
    .string()
    .regex(/^\d{1,10}$/)
    .nullable(),
  anilistId: z
    .string()
    .regex(/^\d{1,10}$/)
    .nullable(),
  malId: z
    .string()
    .regex(/^\d{1,10}$/)
    .nullable(),
  cast: z.array(CastEntrySchema).max(200),
  note: z.string().trim().max(2000).nullable(),
};

const TitleFieldSchema = z.enum([
  'title',
  'sortTitle',
  'originalTitle',
  'tagline',
  'overview',
  'releaseDate',
  'addedAt',
  'status',
  'genres',
  'tags',
  'studios',
  'networks',
  'certifications',
  'rating',
  'rottenTomatoes',
  'imdbId',
  'tvdbId',
  'anilistId',
  'malId',
  'cast',
  'note',
]);

const FIELDS_OF_KIND: Record<
  z.infer<typeof TitleSubjectKindSchema>,
  readonly z.infer<typeof TitleFieldSchema>[]
> = {
  film: [
    'title',
    'sortTitle',
    'originalTitle',
    'tagline',
    'overview',
    'releaseDate',
    'addedAt',
    'genres',
    'tags',
    'studios',
    'certifications',
    'rating',
    'rottenTomatoes',
    'imdbId',
    'tvdbId',
    'cast',
    'note',
  ],
  show: [
    'title',
    'sortTitle',
    'originalTitle',
    'tagline',
    'overview',
    'releaseDate',
    'status',
    'genres',
    'tags',
    'studios',
    'networks',
    'certifications',
    'rating',
    'imdbId',
    'tvdbId',
    'anilistId',
    'malId',
    'cast',
    'note',
  ],
  season: ['title', 'overview', 'releaseDate', 'note'],
  episode: ['title', 'overview', 'releaseDate', 'addedAt', 'note'],
};

const TitleValueSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
  z.array(CastEntrySchema),
  z.record(z.string(), z.string()),
  z.null(),
]);

const FieldSourceSchema = z.enum(['catalogue', 'file', 'edited', 'locked']);

const TitleFieldStateSchema = z.object({
  value: TitleValueSchema,
  source: FieldSourceSchema,
  catalogue: TitleValueSchema.optional(),
  catalogueChangedAt: z.string().nullish(),
  setAt: z.string().nullish(),
  setBy: z.string().nullish(),
});

const TitleSubjectSchema = z.object({
  kind: TitleSubjectKindSchema,
  key: z.string(),
  libraryId: z.string(),
  isMatched: z.boolean(),
});

const TitleMetadataSchema = z.object({
  subject: TitleSubjectSchema,
  fields: z.partialRecord(TitleFieldSchema, TitleFieldStateSchema),
  certificationRegion: z.string().optional(),
});

const TitleEditRequestSchema = z.object({
  set: z.partialRecord(TitleFieldSchema, TitleValueSchema).optional(),
  reset: z.array(TitleFieldSchema).optional(),
  lock: z.array(TitleFieldSchema).optional(),
});

const TitleChangeSchema = z.object({
  changeSetId: z.string(),
  at: z.string(),
  by: z.string().nullable(),
  action: z.enum(['set', 'reset', 'lock', 'undo', 'rematch']),
  fields: z.array(
    z.object({
      field: TitleFieldSchema,
      before: TitleValueSchema,
      after: TitleValueSchema,
    }),
  ),
});

const TitleHistorySchema = z.object({ changes: z.array(TitleChangeSchema) });

const TitleEditOutcomeSchema = z.object({
  changeSetId: z.string().nullable(),
  metadata: TitleMetadataSchema,
});

const MatchPreviewSchema = z.object({
  kind: TitleSubjectKindSchema,
  rows: z.array(
    z.object({
      field: TitleFieldSchema,
      current: TitleFieldStateSchema,
      next: TitleValueSchema,
    }),
  ),
  posterUrl: z.string().nullable(),
  backdropUrl: z.string().nullable(),
});

type TitleSubjectKind = z.infer<typeof TitleSubjectKindSchema>;
type TitleField = z.infer<typeof TitleFieldSchema>;
type CastEntry = z.infer<typeof CastEntrySchema>;
type TitleValue = z.infer<typeof TitleValueSchema>;
type FieldSource = z.infer<typeof FieldSourceSchema>;
type TitleFieldState = z.infer<typeof TitleFieldStateSchema>;
type TitleSubject = z.infer<typeof TitleSubjectSchema>;
type TitleMetadata = z.infer<typeof TitleMetadataSchema>;
type TitleEditRequest = z.infer<typeof TitleEditRequestSchema>;
type TitleChange = z.infer<typeof TitleChangeSchema>;
type TitleHistory = z.infer<typeof TitleHistorySchema>;
type TitleEditOutcome = z.infer<typeof TitleEditOutcomeSchema>;
type MatchPreview = z.infer<typeof MatchPreviewSchema>;

export type {
  CastEntry,
  TitleSubjectKind,
  TitleField,
  TitleValue,
  FieldSource,
  TitleFieldState,
  TitleSubject,
  TitleMetadata,
  TitleEditRequest,
  TitleChange,
  TitleHistory,
  TitleEditOutcome,
  MatchPreview,
};

export {
  CastEntrySchema,
  TITLE_SUBJECT_KINDS,
  TITLE_FIELD_SCHEMAS,
  FIELDS_OF_KIND,
  DaySchema,
  TitleSubjectKindSchema,
  TitleFieldSchema,
  TitleValueSchema,
  FieldSourceSchema,
  TitleFieldStateSchema,
  TitleSubjectSchema,
  TitleMetadataSchema,
  TitleEditRequestSchema,
  TitleChangeSchema,
  TitleHistorySchema,
  TitleEditOutcomeSchema,
  MatchPreviewSchema,
};
