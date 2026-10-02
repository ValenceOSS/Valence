import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { FulfilmentSchema, ProwlarrImportSchema } from './ArrApp';
import { DownloadClientKindSchema } from './DownloadClient';
import { LibraryKindSchema } from './Library';
import { MusicBrainzIdSchema } from './MediaRequest';
import { ProfileKindSchema } from './QualityProfile';

const ARR_IMPORT_SOURCE_KINDS = [
  'radarr',
  'sonarr',
  'lidarr',
  'prowlarr',
  'overseerr',
  'jellyseerr',
] as const;

const ArrImportSourceKindSchema = z.enum(ARR_IMPORT_SOURCE_KINDS);

const ArrImportSourceSchema = z.object({
  kind: ArrImportSourceKindSchema,
  url: z.string().trim().max(500).url(),
  apiKey: z.string().trim().min(1).max(200),
});

const ArrPathMappingSchema = z.object({
  from: z.string().trim().min(1).max(500),
  to: z.string().trim().min(1).max(500),
});

const ARR_LIBRARY_CHOICES = ['handOff', 'takeOver', 'leave'] as const;

const ArrLibraryChoiceSchema = z.enum(ARR_LIBRARY_CHOICES);

const ArrImportAskSchema = z.object({
  sources: z.array(ArrImportSourceSchema).min(1).max(20),
  pathMappings: z.array(ArrPathMappingSchema).max(50).default([]),
  secrets: z.record(z.string().min(1).max(600), z.string().max(200)).default({}),
  choices: z.record(z.string().min(1).max(100), ArrLibraryChoiceSchema).default({}),
});

const ArrImportLibrarySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  kind: LibraryKindSchema,
  path: z.string(),
  requestPath: z.string().nullable(),
});

const ArrImportOrderSchema = ArrImportAskSchema.extend({
  libraries: z.array(ArrImportLibrarySchema).max(500).default([]),
});

const ARR_IMPORT_STANDINGS = ['new', 'kept', 'unsupported'] as const;

const ArrImportStandingSchema = z.enum(ARR_IMPORT_STANDINGS);

const ArrImportedSourceSchema = z.object({
  kind: ArrImportSourceKindSchema,
  url: z.string(),
  name: z.string(),
  version: z.string().nullable(),
  foundThrough: z.string().nullable(),
  problem: SaidSchema.nullable(),
});

const ARR_SECRET_FIELDS = ['password', 'apiKey'] as const;

const ArrImportSecretSchema = z.object({
  key: z.string(),
  field: z.enum(ARR_SECRET_FIELDS),
  item: z.string(),
  from: z.array(z.string()),
});

const ArrImportClientSchema = z.object({
  key: z.string(),
  name: z.string(),
  implementation: z.string(),
  kind: DownloadClientKindSchema.nullable(),
  url: z.string().nullable(),
  from: z.array(z.string()),
  standing: ArrImportStandingSchema,
  notes: z.array(SaidSchema),
});

const ArrImportIndexerSchema = z.object({
  key: z.string(),
  name: z.string(),
  kind: z.enum(['torznab', 'newznab']).nullable(),
  url: z.string().nullable(),
  from: z.array(z.string()),
  standing: ArrImportStandingSchema,
  notes: z.array(SaidSchema),
});

const ArrImportProwlarrSchema = z.object({
  name: z.string(),
  url: z.string(),
  indexerCount: z.number().int().nonnegative(),
  standing: ArrImportStandingSchema,
});

const ArrImportProfileSchema = z.object({
  key: z.string(),
  name: z.string(),
  kind: ProfileKindSchema,
  from: z.string(),
  standing: ArrImportStandingSchema,
  notes: z.array(SaidSchema),
});

const ArrImportLibraryPlanSchema = z.object({
  libraryId: z.string(),
  libraryName: z.string(),
  libraryKind: LibraryKindSchema,
  appName: z.string(),
  appUrl: z.string(),
  rootFolders: z.array(z.string()),
  isGuessed: z.boolean(),
  profileName: z.string().nullable(),
});

const ArrImportUnplacedFolderSchema = z.object({ from: z.string(), path: z.string() });

const ArrImportWantedCountSchema = z.object({
  films: z.number().int().nonnegative(),
  series: z.number().int().nonnegative(),
  artists: z.number().int().nonnegative(),
  requests: z.number().int().nonnegative(),
  unaskable: z.number().int().nonnegative(),
});

const ArrImportPlanSchema = z.object({
  sources: z.array(ArrImportedSourceSchema),
  clients: z.array(ArrImportClientSchema),
  indexers: z.array(ArrImportIndexerSchema),
  prowlarr: ArrImportProwlarrSchema.nullable(),
  profiles: z.array(ArrImportProfileSchema),
  libraries: z.array(ArrImportLibraryPlanSchema),
  unplacedFolders: z.array(ArrImportUnplacedFolderSchema),
  wanted: ArrImportWantedCountSchema,
  secrets: z.array(ArrImportSecretSchema),
});

const ArrRequesterSchema = z.object({
  name: z.string(),
  email: z.string().nullable(),
  plexId: z.number().int().nullable(),
  jellyfinUserId: z.string().nullable(),
});

const ARR_WANTED_KINDS = ['film', 'series', 'artist'] as const;

const ArrWantedSchema = z.object({
  key: z.string().min(1).max(200),
  kind: z.enum(ARR_WANTED_KINDS),
  tmdbId: z.number().int().positive().nullable(),
  tvdbId: z.number().int().positive().nullable(),
  musicBrainzId: MusicBrainzIdSchema.nullable(),
  title: z.string().max(500),
  seasons: z.array(z.number().int().nonnegative()).max(200).nullable(),
  libraryId: z.string().nullable(),
  profileId: z.string().uuid().nullable(),
  isApproved: z.boolean(),
  requester: ArrRequesterSchema.nullable(),
});

const ArrImportCountSchema = z.object({
  added: z.number().int().nonnegative(),
  kept: z.number().int().nonnegative(),
});

const ArrLibrarySettingSchema = z.object({
  libraryId: z.string(),
  choice: ArrLibraryChoiceSchema,
  fulfilment: FulfilmentSchema.nullable(),
  profileId: z.string().uuid().nullable(),
});

const ArrImportAppliedSchema = z.object({
  clients: ArrImportCountSchema,
  indexers: ArrImportCountSchema,
  profiles: ArrImportCountSchema,
  apps: ArrImportCountSchema,
  prowlarr: ProwlarrImportSchema.nullable(),
  libraries: z.array(ArrLibrarySettingSchema),
  wanted: z.array(ArrWantedSchema),
  problems: z.array(SaidSchema),
});

const ArrWantedBatchSchema = z.object({ items: z.array(ArrWantedSchema).min(1).max(25) });

const ArrWantedOutcomeSchema = z.object({
  made: z.number().int().nonnegative(),
  already: z.number().int().nonnegative(),
  failed: z.array(z.object({ key: z.string(), title: z.string(), problem: SaidSchema })),
});

type ArrImportSourceKind = z.infer<typeof ArrImportSourceKindSchema>;
type ArrImportSource = z.infer<typeof ArrImportSourceSchema>;
type ArrPathMapping = z.infer<typeof ArrPathMappingSchema>;
type ArrLibraryChoice = z.infer<typeof ArrLibraryChoiceSchema>;
type ArrImportAsk = z.input<typeof ArrImportAskSchema>;
type ArrImportLibrary = z.infer<typeof ArrImportLibrarySchema>;
type ArrImportOrder = z.infer<typeof ArrImportOrderSchema>;
type ArrImportStanding = z.infer<typeof ArrImportStandingSchema>;
type ArrImportedSource = z.infer<typeof ArrImportedSourceSchema>;
type ArrImportSecret = z.infer<typeof ArrImportSecretSchema>;
type ArrImportClient = z.infer<typeof ArrImportClientSchema>;
type ArrImportIndexer = z.infer<typeof ArrImportIndexerSchema>;
type ArrImportProwlarr = z.infer<typeof ArrImportProwlarrSchema>;
type ArrImportProfile = z.infer<typeof ArrImportProfileSchema>;
type ArrImportLibraryPlan = z.infer<typeof ArrImportLibraryPlanSchema>;
type ArrImportUnplacedFolder = z.infer<typeof ArrImportUnplacedFolderSchema>;
type ArrImportWantedCount = z.infer<typeof ArrImportWantedCountSchema>;
type ArrImportPlan = z.infer<typeof ArrImportPlanSchema>;
type ArrRequester = z.infer<typeof ArrRequesterSchema>;
type ArrWanted = z.infer<typeof ArrWantedSchema>;
type ArrImportCount = z.infer<typeof ArrImportCountSchema>;
type ArrLibrarySetting = z.infer<typeof ArrLibrarySettingSchema>;
type ArrImportApplied = z.infer<typeof ArrImportAppliedSchema>;
type ArrWantedOutcome = z.infer<typeof ArrWantedOutcomeSchema>;

export type {
  ArrImportApplied,
  ArrImportAsk,
  ArrImportClient,
  ArrImportCount,
  ArrImportIndexer,
  ArrImportLibrary,
  ArrImportLibraryPlan,
  ArrImportOrder,
  ArrImportPlan,
  ArrImportProfile,
  ArrImportProwlarr,
  ArrImportSecret,
  ArrImportSource,
  ArrImportSourceKind,
  ArrImportStanding,
  ArrImportUnplacedFolder,
  ArrImportWantedCount,
  ArrImportedSource,
  ArrLibraryChoice,
  ArrLibrarySetting,
  ArrPathMapping,
  ArrRequester,
  ArrWanted,
  ArrWantedOutcome,
};

export {
  ARR_IMPORT_SOURCE_KINDS,
  ARR_IMPORT_STANDINGS,
  ARR_LIBRARY_CHOICES,
  ARR_SECRET_FIELDS,
  ARR_WANTED_KINDS,
  ArrImportAppliedSchema,
  ArrImportAskSchema,
  ArrImportClientSchema,
  ArrImportCountSchema,
  ArrImportIndexerSchema,
  ArrImportLibraryPlanSchema,
  ArrImportLibrarySchema,
  ArrImportOrderSchema,
  ArrImportPlanSchema,
  ArrImportProfileSchema,
  ArrImportProwlarrSchema,
  ArrImportSecretSchema,
  ArrImportSourceKindSchema,
  ArrImportSourceSchema,
  ArrImportStandingSchema,
  ArrImportUnplacedFolderSchema,
  ArrImportWantedCountSchema,
  ArrImportedSourceSchema,
  ArrLibraryChoiceSchema,
  ArrLibrarySettingSchema,
  ArrPathMappingSchema,
  ArrRequesterSchema,
  ArrWantedBatchSchema,
  ArrWantedOutcomeSchema,
  ArrWantedSchema,
};
