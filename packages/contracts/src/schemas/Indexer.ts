import { z } from 'zod';

const INDEXER_KINDS = ['torznab', 'newznab', 'cardigann'] as const;

const IndexerKindSchema = z.enum(INDEXER_KINDS);

const INDEXER_SEARCH_MODES = ['search', 'movie', 'tv', 'music', 'book'] as const;

const IndexerSearchModeSchema = z.enum(INDEXER_SEARCH_MODES);

const IndexerCategorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  subcategories: z.array(z.object({ id: z.number().int(), name: z.string() })),
});

const IndexerSearchModeSupportSchema = z.object({
  mode: IndexerSearchModeSchema,
  parameters: z.array(z.string()),
});

const IndexerCapabilitiesSchema = z.object({
  categories: z.array(IndexerCategorySchema),
  modes: z.array(IndexerSearchModeSupportSchema),
  limit: z.number().int().positive().nullable(),
});

const ReleaseProtocolSchema = z.enum(['torrent', 'usenet']);

const IndexerSettingsSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));

const IndexerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: IndexerKindSchema,
  url: z.string().url(),
  hasApiKey: z.boolean(),
  definitionId: z.string().nullable().default(null),
  settings: IndexerSettingsSchema.default({}),
  secretsSet: z.array(z.string()).default([]),
  privacy: z.enum(['public', 'semi-private', 'private']).nullable().default(null),
  priority: z.number().int().min(1).max(50),
  isEnabled: z.boolean(),
  categories: z.array(z.number().int()),
  requestsPerMinute: z.number().int().positive().nullable(),
  timeoutSeconds: z.number().int().min(5).max(120),
  capabilities: IndexerCapabilitiesSchema.nullable(),
  failures: z.number().int().nonnegative(),
  lastProblem: z.string().nullable(),
  lastFailedAt: z.string().datetime().nullable(),
  turnedOffBecause: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const IndexerDraftSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: IndexerKindSchema,
  url: z.string().trim().url(),
  apiKey: z.string().trim().max(200).default(''),
  priority: z.number().int().min(1).max(50).default(25),
  isEnabled: z.boolean().default(true),
  categories: z.array(z.number().int()).default([]),
  requestsPerMinute: z.number().int().positive().max(600).nullable().default(null),
  timeoutSeconds: z.number().int().min(5).max(120).default(30),
  definitionId: z.string().min(1).nullable().default(null),
  settings: IndexerSettingsSchema.default({}),
});

const IndexerChangeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  kind: IndexerKindSchema.optional(),
  url: z.string().trim().url().optional(),
  apiKey: z.string().trim().max(200).optional(),
  priority: z.number().int().min(1).max(50).optional(),
  isEnabled: z.boolean().optional(),
  categories: z.array(z.number().int()).optional(),
  requestsPerMinute: z.number().int().positive().max(600).nullable().optional(),
  timeoutSeconds: z.number().int().min(5).max(120).optional(),
  settings: IndexerSettingsSchema.optional(),
});

const IndexerTestSchema = z.object({
  isWorking: z.boolean(),
  problem: z.string().nullable(),
  capabilities: IndexerCapabilitiesSchema.nullable(),
  captcha: z.object({ image: z.string() }).nullable().default(null),
});

const ReleaseDownloadRequestSchema = z.object({ url: z.string().min(1) });

const ReleaseSearchSchema = z.object({
  query: z.string().trim().max(200).default(''),
  mode: IndexerSearchModeSchema.default('search'),
  imdbId: z
    .string()
    .regex(/^tt\d+$/)
    .optional(),
  tmdbId: z.number().int().positive().optional(),
  tvdbId: z.number().int().positive().optional(),
  season: z.number().int().nonnegative().optional(),
  episode: z.number().int().nonnegative().optional(),
  artist: z.string().trim().max(200).optional(),
  album: z.string().trim().max(200).optional(),
  categories: z.array(z.number().int()).optional(),
  indexerIds: z.array(z.string().uuid()).optional(),
});

const ReleaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  indexerId: z.string().uuid(),
  indexerName: z.string(),
  protocol: ReleaseProtocolSchema,
  sizeBytes: z.number().nonnegative().nullable(),
  seeders: z.number().int().nonnegative().nullable(),
  leechers: z.number().int().nonnegative().nullable(),
  grabs: z.number().int().nonnegative().nullable(),
  publishedAt: z.string().datetime().nullable(),
  categories: z.array(z.number().int()),
  downloadUrl: z.string().nullable(),
  magnetUrl: z.string().nullable(),
  infoUrl: z.string().nullable(),
  infoHash: z.string().nullable(),
  downloadFactor: z.number().nonnegative().nullable().default(null),
  uploadFactor: z.number().nonnegative().nullable().default(null),
  minimumRatio: z.number().nonnegative().nullable().default(null),
  minimumSeedSeconds: z.number().int().nonnegative().nullable().default(null),
});

const IndexerSearchReportSchema = z.object({
  indexerId: z.string().uuid(),
  indexerName: z.string(),
  found: z.number().int().nonnegative(),
  tookMs: z.number().int().nonnegative(),
  problem: z.string().nullable(),
});

const ReleaseSearchOutcomeSchema = z.object({
  releases: z.array(ReleaseSchema),
  indexers: z.array(IndexerSearchReportSchema),
});

const IndexerHealthSchema = z.object({
  total: z.number().int().nonnegative(),
  enabled: z.number().int().nonnegative(),
  failing: z.array(z.object({ id: z.string().uuid(), name: z.string(), problem: z.string() })),
});

type IndexerKind = z.infer<typeof IndexerKindSchema>;
type IndexerSearchMode = z.infer<typeof IndexerSearchModeSchema>;
type IndexerCategory = z.infer<typeof IndexerCategorySchema>;
type IndexerCapabilities = z.infer<typeof IndexerCapabilitiesSchema>;
type Indexer = z.infer<typeof IndexerSchema>;
type IndexerDraft = z.input<typeof IndexerDraftSchema>;
type IndexerChange = z.infer<typeof IndexerChangeSchema>;
type IndexerTest = z.infer<typeof IndexerTestSchema>;
type ReleaseSearch = z.input<typeof ReleaseSearchSchema>;
type Release = z.infer<typeof ReleaseSchema>;
type IndexerSearchReport = z.infer<typeof IndexerSearchReportSchema>;
type ReleaseSearchOutcome = z.infer<typeof ReleaseSearchOutcomeSchema>;
type IndexerHealth = z.infer<typeof IndexerHealthSchema>;
type IndexerSettings = z.infer<typeof IndexerSettingsSchema>;
type ReleaseProtocol = z.infer<typeof ReleaseProtocolSchema>;

export type {
  Indexer,
  IndexerCapabilities,
  IndexerCategory,
  IndexerChange,
  IndexerDraft,
  IndexerHealth,
  IndexerKind,
  IndexerSearchMode,
  IndexerSearchReport,
  IndexerSettings,
  IndexerTest,
  Release,
  ReleaseProtocol,
  ReleaseSearch,
  ReleaseSearchOutcome,
};

export {
  INDEXER_KINDS,
  INDEXER_SEARCH_MODES,
  IndexerCapabilitiesSchema,
  IndexerCategorySchema,
  IndexerChangeSchema,
  IndexerDraftSchema,
  IndexerHealthSchema,
  IndexerKindSchema,
  IndexerSchema,
  IndexerSearchModeSchema,
  IndexerSettingsSchema,
  IndexerTestSchema,
  ReleaseDownloadRequestSchema,
  ReleaseProtocolSchema,
  ReleaseSchema,
  ReleaseSearchOutcomeSchema,
  ReleaseSearchSchema,
};
