import { z } from 'zod';
import { MediaSummarySchema } from './Library';

const TITLE_SORTS = [
  'title',
  'year',
  'quality',
  'codec',
  'audio',
  'length',
  'size',
  'added',
] as const;

const TITLE_SHOWS = ['all', 'look', 'twice', 'unreadable', 'edited'] as const;

const TITLE_FILTER_KINDS = [
  'missing',
  'resolution',
  'range',
  'codec',
  'genre',
  'tag',
  'year',
  'rating',
  'added',
  'subtitles',
] as const;

const TitleFilterSchema = z.object({ kind: z.enum(TITLE_FILTER_KINDS), value: z.string().min(1) });

const TitleListQuerySchema = z.object({
  libraryId: z.string().min(1),
  sort: z.enum(TITLE_SORTS).default('title'),
  desc: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  search: z.string().optional(),
  show: z.enum(TITLE_SHOWS).default('all'),
  filter: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((given) => (given === undefined ? [] : Array.isArray(given) ? given : [given])),
});

const AudioLookSchema = z.object({ codec: z.string(), channels: z.number(), isAtmos: z.boolean() });

const TitleLooksSchema = z.object({
  step: z.string().nullable(),
  isStepMixed: z.boolean(),
  range: z.string().nullable(),
  isRangeMixed: z.boolean(),
  codec: z.string().nullable(),
  isCodecMixed: z.boolean(),
  audio: AudioLookSchema.nullable(),
  isAudioMixed: z.boolean(),
});

const ProblemFilesSchema = z.object({
  duplicate: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      group: z.string().nullable(),
      isOwn: z.boolean(),
    }),
  ),
  unreadable: z.array(z.object({ id: z.string(), path: z.string() })),
});

const TitleRowSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: z.enum(['film', 'show']),
  libraryId: z.string(),
  lead: MediaSummarySchema,
  name: z.string(),
  order: z.string(),
  year: z.number().int().nullable(),
  files: z.number().int().nonnegative(),
  versions: z.number().int().nonnegative(),
  seasons: z.number().int().nonnegative(),
  episodes: z.number().int().nonnegative(),
  episodeTotal: z.number().int().nonnegative().nullable().optional(),
  sizeBytes: z.number().nonnegative().nullable(),
  durationSeconds: z.number().nonnegative(),
  latestAddedAt: z.string(),
  isMatched: z.boolean(),
  posterFrom: z.string().nullable(),
  folder: z.string().nullable(),
  leadPath: z.string().nullable(),
  looks: TitleLooksSchema,
  problemFiles: ProblemFilesSchema,
  isEdited: z.boolean(),
});

const TitleCountsSchema = z.object({
  all: z.number().int().nonnegative(),
  look: z.number().int().nonnegative(),
  twice: z.number().int().nonnegative(),
  unreadable: z.number().int().nonnegative(),
  edited: z.number().int().nonnegative(),
});

const TitlePageSchema = z.object({
  titles: z.array(TitleRowSchema),
  next: z.string().nullable(),
  total: z.number().int().nonnegative(),
  counts: TitleCountsSchema,
});

const TitleKeysSchema = z.object({
  titles: z.array(
    z.object({
      id: z.string(),
      leadId: z.string(),
      kind: z.enum(['film', 'show']),
      name: z.string(),
    }),
  ),
});

const TitleChoicesSchema = z.object({
  filters: z.array(
    z.object({
      kind: z.enum(TITLE_FILTER_KINDS),
      values: z.array(z.object({ value: z.string(), count: z.number().int().nonnegative() })),
    }),
  ),
});

const LibraryProblemsSchema = z.object({
  libraries: z.array(z.object({ libraryId: z.string(), titles: z.number().int().nonnegative() })),
});

const TitleFilesSchema = z.object({
  files: z.array(MediaSummarySchema),
  paths: z.record(z.string(), z.string()).default({}),
});

const TitleValuesSchema = z.object({
  values: z.array(z.object({ value: z.string(), count: z.number().int().positive() })),
});

const TitleCandidatesSchema = z.object({
  matches: z.array(
    z.object({
      externalId: z.string(),
      kind: z.enum(['tv', 'movie']),
      title: z.string(),
      year: z.number().int().nullable(),
      overview: z.string().nullable(),
      posterUrl: z.string().nullable(),
    }),
  ),
  hasMore: z.boolean(),
  total: z.number().int().nonnegative(),
});

const TITLE_VALUE_FIELDS = ['genres', 'tags', 'studios', 'networks'] as const;

type TitleSort = (typeof TITLE_SORTS)[number];
type TitleShow = (typeof TITLE_SHOWS)[number];
type TitleFilterKind = (typeof TITLE_FILTER_KINDS)[number];
type TitleFilter = z.infer<typeof TitleFilterSchema>;
type TitleListQuery = z.infer<typeof TitleListQuerySchema>;
type TitleLooks = z.infer<typeof TitleLooksSchema>;
type ProblemFiles = z.infer<typeof ProblemFilesSchema>;
type TitleRow = z.infer<typeof TitleRowSchema>;
type TitleCounts = z.infer<typeof TitleCountsSchema>;
type TitlePage = z.infer<typeof TitlePageSchema>;
type TitleKeys = z.infer<typeof TitleKeysSchema>;
type TitleChoices = z.infer<typeof TitleChoicesSchema>;
type LibraryProblems = z.infer<typeof LibraryProblemsSchema>;
type TitleFiles = z.infer<typeof TitleFilesSchema>;
type TitleValues = z.infer<typeof TitleValuesSchema>;
type TitleValueField = (typeof TITLE_VALUE_FIELDS)[number];
type TitleCandidates = z.infer<typeof TitleCandidatesSchema>;

export type {
  TitleSort,
  TitleShow,
  TitleFilterKind,
  TitleFilter,
  TitleListQuery,
  TitleLooks,
  ProblemFiles,
  TitleRow,
  TitleCounts,
  TitlePage,
  TitleKeys,
  TitleChoices,
  LibraryProblems,
  TitleFiles,
  TitleValues,
  TitleValueField,
  TitleCandidates,
};

export {
  TITLE_VALUE_FIELDS,
  TITLE_SORTS,
  TITLE_SHOWS,
  TITLE_FILTER_KINDS,
  TitleFilterSchema,
  TitleListQuerySchema,
  TitleRowSchema,
  TitleCountsSchema,
  TitlePageSchema,
  TitleKeysSchema,
  TitleChoicesSchema,
  LibraryProblemsSchema,
  TitleFilesSchema,
  TitleValuesSchema,
  TitleCandidatesSchema,
};
