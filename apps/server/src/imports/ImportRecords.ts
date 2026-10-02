import { z } from 'zod';
import { PathMappingSchema } from '@ValenceContracts/schemas/MediaImport';
import type {
  MediaImportKind,
  MediaImportReport,
  MediaImportRunState,
} from '@ValenceContracts/schemas/MediaImport';
import type { Said } from '@ValenceI18n/SaidSchema';

const IMPORT_PHASES = [
  'accounts',
  'access',
  'viewing',
  'collections',
  'playlists',
  'markers',
  'done',
] as const;

const ImportSourceDetailsSchema = z.object({
  serverId: z.string().default(''),
  version: z.string().default('0'),
  clientId: z.string().default(''),
  userTokens: z.record(z.string(), z.string()).default({}),
  pathMappings: z.array(PathMappingSchema).default([]),
});

const ImportRunOptionsSchema = z.object({
  skipUserIds: z.array(z.string()).default([]),
  meUserId: z.string().nullable().default(null),
  by: z.string().nullable().default(null),
});

const ImportCursorSchema = z.object({
  phase: z.enum(IMPORT_PHASES),
  index: z.number().int().nonnegative().default(0),
});

type ImportPhase = (typeof IMPORT_PHASES)[number];
type ImportSourceDetails = z.infer<typeof ImportSourceDetailsSchema>;
type ImportRunOptions = z.infer<typeof ImportRunOptionsSchema>;
type ImportCursor = z.infer<typeof ImportCursorSchema>;

type StoredImportSource = {
  id: string;
  kind: MediaImportKind;
  name: string;
  url: string;
  token: string;
  details: ImportSourceDetails;
  createdAt: Date;
};

type StoredImportRun = {
  id: string;
  sourceId: string;
  state: MediaImportRunState;
  options: ImportRunOptions;
  cursor: ImportCursor | null;
  report: MediaImportReport | null;
  failure: Said | null;
  jobId: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

type ImportRunChange = Partial<
  Pick<
    StoredImportRun,
    'state' | 'cursor' | 'report' | 'failure' | 'jobId' | 'startedAt' | 'finishedAt'
  >
>;

export type {
  ImportCursor,
  ImportPhase,
  ImportRunChange,
  ImportRunOptions,
  ImportSourceDetails,
  StoredImportRun,
  StoredImportSource,
};

export { IMPORT_PHASES, ImportCursorSchema, ImportRunOptionsSchema, ImportSourceDetailsSchema };
