import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { ProblemCodeFieldSchema } from './ProblemCode';

const ARR_APP_KINDS = ['radarr', 'sonarr', 'lidarr', 'prowlarr'] as const;

const ArrAppKindSchema = z.enum(ARR_APP_KINDS);

const FULFILLING_ARR_APP_KINDS = ['radarr', 'sonarr', 'lidarr'] as const;

const FulfillingArrAppKindSchema = z.enum(FULFILLING_ARR_APP_KINDS);

const ArrPathSchema = z
  .string()
  .trim()
  .max(500)
  .transform((path) => (path.length > 1 ? path.replace(/\/+$/, '') : path));

const ArrAppSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: ArrAppKindSchema,
  url: z.string().url(),
  hasApiKey: z.boolean(),
  remotePath: z.string(),
  localPath: z.string(),
  isEnabled: z.boolean(),
  isWorking: z.boolean().nullable(),
  version: z.string().nullable(),
  lastCheckedAt: z.string().datetime().nullable(),
  lastProblem: SaidSchema.nullable(),
  lastProblemCode: ProblemCodeFieldSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const ArrAppDraftSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: ArrAppKindSchema,
  url: z.string().trim().url(),
  apiKey: z.string().trim().max(200).default(''),
  remotePath: ArrPathSchema.default(''),
  localPath: ArrPathSchema.default(''),
  isEnabled: z.boolean().default(true),
});

const ArrAppChangeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  url: z.string().trim().url().optional(),
  apiKey: z.string().trim().max(200).optional(),
  remotePath: ArrPathSchema.optional(),
  localPath: ArrPathSchema.optional(),
  isEnabled: z.boolean().optional(),
});

const ArrAppTestSchema = z.object({
  isWorking: z.boolean(),
  problem: SaidSchema.nullable(),
  problemCode: ProblemCodeFieldSchema,
  version: z.string().nullable(),
});

const ArrAppOptionSchema = z.object({ id: z.number().int(), name: z.string() });

const ArrRootFolderSchema = z.object({
  id: z.number().int(),
  path: z.string(),
  freeBytes: z.number().nonnegative().nullable(),
  isAccessible: z.boolean(),
});

const ArrAppChoicesSchema = z.object({
  rootFolders: z.array(ArrRootFolderSchema),
  qualityProfiles: z.array(ArrAppOptionSchema),
  metadataProfiles: z.array(ArrAppOptionSchema),
});

const FulfilmentSchema = z.object({
  appId: z.string().uuid(),
  rootFolderPath: z.string().trim().min(1).max(500),
  qualityProfileId: z.number().int().positive(),
  metadataProfileId: z.number().int().positive().nullable().default(null),
  searchesOnAdd: z.boolean().default(true),
});

const ArrQueueItemSchema = z.object({
  id: z.number().int(),
  appId: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  progress: z.number().min(0).max(1),
  sizeBytes: z.number().nonnegative().nullable(),
  leftBytes: z.number().nonnegative().nullable(),
  downloadClient: z.string().nullable(),
  secondsLeft: z.number().int().nonnegative().nullable(),
  problem: SaidSchema.nullable(),
});

const ArrQueueAppSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: FulfillingArrAppKindSchema,
  problem: SaidSchema.nullable(),
  problemCode: ProblemCodeFieldSchema,
});

const ArrQueueSchema = z.object({
  apps: z.array(ArrQueueAppSchema),
  items: z.array(ArrQueueItemSchema),
});

const ProwlarrImportSchema = z.object({
  added: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
});

type ArrAppKind = z.infer<typeof ArrAppKindSchema>;
type FulfillingArrAppKind = z.infer<typeof FulfillingArrAppKindSchema>;
type ArrApp = z.infer<typeof ArrAppSchema>;
type ArrAppDraft = z.input<typeof ArrAppDraftSchema>;
type ArrAppChange = z.infer<typeof ArrAppChangeSchema>;
type ArrAppTest = z.infer<typeof ArrAppTestSchema>;
const HandedToSchema = z.object({
  appId: z.string().uuid(),
  appName: z.string(),
  appKind: ArrAppKindSchema,
  link: z.string().url().nullable(),
});

type ArrAppOption = z.infer<typeof ArrAppOptionSchema>;
type HandedTo = z.infer<typeof HandedToSchema>;
type ArrRootFolder = z.infer<typeof ArrRootFolderSchema>;
type ArrAppChoices = z.infer<typeof ArrAppChoicesSchema>;
type Fulfilment = z.infer<typeof FulfilmentSchema>;
type ArrQueueItem = z.infer<typeof ArrQueueItemSchema>;
type ArrQueueApp = z.infer<typeof ArrQueueAppSchema>;
type ArrQueue = z.infer<typeof ArrQueueSchema>;
type ProwlarrImport = z.infer<typeof ProwlarrImportSchema>;

export type {
  ArrApp,
  ArrAppChange,
  ArrAppChoices,
  ArrAppDraft,
  ArrAppKind,
  ArrAppOption,
  ArrAppTest,
  ArrQueue,
  ArrQueueApp,
  ArrQueueItem,
  ArrRootFolder,
  FulfillingArrAppKind,
  Fulfilment,
  HandedTo,
  ProwlarrImport,
};

export {
  ARR_APP_KINDS,
  FULFILLING_ARR_APP_KINDS,
  ArrAppChangeSchema,
  ArrAppChoicesSchema,
  ArrAppDraftSchema,
  ArrAppKindSchema,
  ArrAppOptionSchema,
  ArrAppSchema,
  ArrAppTestSchema,
  ArrQueueAppSchema,
  ArrQueueItemSchema,
  ArrQueueSchema,
  ArrRootFolderSchema,
  FulfillingArrAppKindSchema,
  FulfilmentSchema,
  HandedToSchema,
  ProwlarrImportSchema,
};
