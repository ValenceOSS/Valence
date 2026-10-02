import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { LibraryKindSchema } from './Library';
import { SetupLinkLifetimeSchema } from './SetupLink';

const MEDIA_IMPORT_KINDS = ['jellyfin', 'emby', 'plex'] as const;

const MEDIA_IMPORT_RUN_STATES = [
  'planning',
  'planned',
  'importing',
  'completed',
  'failed',
  'cancelled',
] as const;

const MEDIA_IMPORT_PERSON_ACCESS = ['readable', 'needsPin', 'unreadable'] as const;

const MEDIA_IMPORT_OUTCOMES = ['created', 'linked', 'you', 'failed'] as const;

const MEDIA_IMPORT_UNMATCHED_KINDS = ['movie', 'episode', 'series', 'track', 'other'] as const;

const REQUESTS_REACH = ['off', 'unreachable', 'reachable'] as const;

const MediaImportKindSchema = z.enum(MEDIA_IMPORT_KINDS);

const MediaImportRunStateSchema = z.enum(MEDIA_IMPORT_RUN_STATES);

const ConnectMediaImportSchema = z.object({
  kind: MediaImportKindSchema,
  url: z.string().trim().url().max(500),
  token: z.string().trim().min(1).max(500),
});

const MediaImportSourceSchema = z.object({
  id: z.string(),
  kind: MediaImportKindSchema,
  name: z.string(),
  url: z.string(),
  version: z.string(),
  createdAt: z.string(),
});

const MediaImportPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  isAdministrator: z.boolean(),
  isDisabled: z.boolean(),
  access: z.enum(MEDIA_IMPORT_PERSON_ACCESS),
});

const MediaImportPeopleSchema = z.object({ people: z.array(MediaImportPersonSchema) });

const MediaImportDoneSchema = z.object({ done: z.boolean() });

const PlexPinSchema = z.object({
  userId: z.string().min(1).max(100),
  pin: z.string().regex(/^\d{4}$/),
});

const PathMappingSchema = z.object({
  from: z.string().trim().min(1).max(1000),
  to: z.string().trim().min(1).max(1000),
});

const PathMappingsSchema = z.object({ mappings: z.array(PathMappingSchema).max(50) });

const MediaImportLocationSchema = z.object({
  sourcePath: z.string(),
  valencePath: z.string(),
  libraryId: z.string().nullable(),
});

const MediaImportLibrarySchema = z.object({
  sourceLibraryId: z.string(),
  name: z.string(),
  kind: LibraryKindSchema.nullable(),
  locations: z.array(MediaImportLocationSchema),
});

const MediaImportLibrariesSchema = z.object({
  mappings: z.array(PathMappingSchema),
  libraries: z.array(MediaImportLibrarySchema),
});

const CreateImportLibrariesSchema = z.object({
  libraries: z
    .array(
      z.object({
        sourceLibraryId: z.string().min(1),
        sourcePath: z.string().min(1),
        name: z.string().trim().min(1).max(100),
        kind: LibraryKindSchema,
      }),
    )
    .min(1)
    .max(100),
});

const LinkImportLibrarySchema = z.object({
  sourceLibraryId: z.string().min(1),
  sourcePath: z.string().min(1),
  libraryId: z.string().min(1),
});

const CreatedImportLibrarySchema = z.object({
  sourcePath: z.string(),
  libraryId: z.string().nullable(),
  jobId: z.string().nullable(),
  problem: SaidSchema.nullable(),
});

const CreatedImportLibrariesSchema = z.object({
  libraries: z.array(CreatedImportLibrarySchema),
});

const PlanMediaImportSchema = z.object({
  skipUserIds: z.array(z.string().min(1)).max(1000).default([]),
  meUserId: z.string().min(1).nullable().default(null),
});

const MediaImportCountsSchema = z.object({
  people: z.number().int().nonnegative(),
  libraries: z.number().int().nonnegative(),
  items: z.number().int().nonnegative(),
  matched: z.number().int().nonnegative(),
  unmatched: z.number().int().nonnegative(),
  watched: z.number().int().nonnegative(),
  resumes: z.number().int().nonnegative(),
  plays: z.number().int().nonnegative(),
  favourites: z.number().int().nonnegative(),
  ratings: z.number().int().nonnegative(),
  playlists: z.number().int().nonnegative(),
  collections: z.number().int().nonnegative(),
  markers: z.number().int().nonnegative(),
});

const MediaImportReportPersonSchema = z.object({
  sourceUserId: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string().nullable(),
  isAdministrator: z.boolean(),
  isDisabled: z.boolean(),
  isYou: z.boolean(),
  skipped: SaidSchema.nullable(),
  watched: z.number().int().nonnegative(),
  resumes: z.number().int().nonnegative(),
  plays: z.number().int().nonnegative(),
  favourites: z.number().int().nonnegative(),
  ratings: z.number().int().nonnegative(),
  playlists: z.number().int().nonnegative(),
  libraries: z.number().int().nonnegative().nullable(),
  maximumAge: z.number().int().min(0).max(21).nullable(),
  userId: z.string().nullable().default(null),
  outcome: z.enum(MEDIA_IMPORT_OUTCOMES).nullable().default(null),
});

const MediaImportUnmatchedSchema = z.object({
  title: z.string(),
  year: z.number().int().nullable(),
  kind: z.enum(MEDIA_IMPORT_UNMATCHED_KINDS),
  reason: SaidSchema,
});

const MediaImportReportSchema = z.object({
  source: z.object({ kind: MediaImportKindSchema, name: z.string(), version: z.string() }),
  counts: MediaImportCountsSchema,
  people: z.array(MediaImportReportPersonSchema),
  unmatched: z.array(MediaImportUnmatchedSchema),
  unmatchedTotal: z.number().int().nonnegative(),
  notBroughtAcross: z.array(SaidSchema),
  written: MediaImportCountsSchema.nullable().default(null),
});

const MediaImportProgressSchema = z.object({
  phase: SaidSchema,
  processed: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

const MediaImportRunSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  state: MediaImportRunStateSchema,
  report: MediaImportReportSchema.nullable(),
  failure: SaidSchema.nullable(),
  progress: MediaImportProgressSchema.nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
});

const MediaImportStatusSchema = z.object({
  sources: z.array(MediaImportSourceSchema),
  runs: z.array(MediaImportRunSchema),
  requests: z.enum(REQUESTS_REACH),
});

const ImportSetupLinksRequestSchema = z.object({
  lifetimeDays: SetupLinkLifetimeSchema.default(7),
});

const ImportedSetupLinkSchema = z.object({
  userId: z.string(),
  name: z.string(),
  url: z.string(),
  expiresAt: z.string(),
  hasEmail: z.boolean(),
});

const ImportedSetupLinksSchema = z.object({
  canEmail: z.boolean(),
  links: z.array(ImportedSetupLinkSchema),
});

type MediaImportKind = z.infer<typeof MediaImportKindSchema>;
type MediaImportRunState = z.infer<typeof MediaImportRunStateSchema>;
type ConnectMediaImport = z.infer<typeof ConnectMediaImportSchema>;
type MediaImportSource = z.infer<typeof MediaImportSourceSchema>;
type MediaImportPerson = z.infer<typeof MediaImportPersonSchema>;
type PlexPin = z.infer<typeof PlexPinSchema>;
type PathMapping = z.infer<typeof PathMappingSchema>;
type MediaImportLocation = z.infer<typeof MediaImportLocationSchema>;
type MediaImportLibrary = z.infer<typeof MediaImportLibrarySchema>;
type MediaImportLibraries = z.infer<typeof MediaImportLibrariesSchema>;
type CreateImportLibraries = z.infer<typeof CreateImportLibrariesSchema>;
type CreatedImportLibrary = z.infer<typeof CreatedImportLibrarySchema>;
type LinkImportLibrary = z.infer<typeof LinkImportLibrarySchema>;
type PlanMediaImport = z.infer<typeof PlanMediaImportSchema>;
type MediaImportCounts = z.infer<typeof MediaImportCountsSchema>;
type MediaImportReportPerson = z.infer<typeof MediaImportReportPersonSchema>;
type MediaImportUnmatched = z.infer<typeof MediaImportUnmatchedSchema>;
type MediaImportReport = z.infer<typeof MediaImportReportSchema>;
type MediaImportProgress = z.infer<typeof MediaImportProgressSchema>;
type MediaImportRun = z.infer<typeof MediaImportRunSchema>;
type MediaImportStatus = z.infer<typeof MediaImportStatusSchema>;
type ImportedSetupLink = z.infer<typeof ImportedSetupLinkSchema>;
type ImportedSetupLinks = z.infer<typeof ImportedSetupLinksSchema>;
type RequestsReach = (typeof REQUESTS_REACH)[number];

export type {
  ConnectMediaImport,
  CreateImportLibraries,
  CreatedImportLibrary,
  LinkImportLibrary,
  ImportedSetupLink,
  ImportedSetupLinks,
  MediaImportCounts,
  MediaImportKind,
  MediaImportLibraries,
  MediaImportLibrary,
  MediaImportLocation,
  MediaImportPerson,
  MediaImportProgress,
  MediaImportReport,
  MediaImportReportPerson,
  MediaImportRun,
  MediaImportRunState,
  MediaImportSource,
  MediaImportStatus,
  MediaImportUnmatched,
  PathMapping,
  PlanMediaImport,
  PlexPin,
  RequestsReach,
};

export {
  ConnectMediaImportSchema,
  CreateImportLibrariesSchema,
  CreatedImportLibrariesSchema,
  CreatedImportLibrarySchema,
  LinkImportLibrarySchema,
  ImportSetupLinksRequestSchema,
  ImportedSetupLinkSchema,
  ImportedSetupLinksSchema,
  MEDIA_IMPORT_KINDS,
  MEDIA_IMPORT_OUTCOMES,
  MEDIA_IMPORT_RUN_STATES,
  MediaImportCountsSchema,
  MediaImportDoneSchema,
  MediaImportKindSchema,
  MediaImportLibrariesSchema,
  MediaImportLibrarySchema,
  MediaImportPeopleSchema,
  MediaImportPersonSchema,
  MediaImportProgressSchema,
  MediaImportReportPersonSchema,
  MediaImportReportSchema,
  MediaImportRunSchema,
  MediaImportRunStateSchema,
  MediaImportSourceSchema,
  MediaImportStatusSchema,
  MediaImportUnmatchedSchema,
  PathMappingSchema,
  PathMappingsSchema,
  PlanMediaImportSchema,
  PlexPinSchema,
  REQUESTS_REACH,
};
