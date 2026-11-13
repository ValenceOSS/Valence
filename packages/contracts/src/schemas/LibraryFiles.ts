import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { MediaOriginSchema } from '@ValenceContracts/schemas/MediaOrigin';

const FILE_STATUSES = [
  'inLibrary',
  'unmatched',
  'extra',
  'leftOut',
  'sample',
  'skipped',
  'unreadable',
  'notReadYet',
  'sidecar',
  'orphaned',
  'notAVideo',
] as const;

const LibraryEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  isFolder: z.boolean(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  modifiedAt: z.string().datetime().nullable(),
  mediaId: z.string().nullable(),
  title: z.string().nullish(),
  titleId: z.string().nullish(),
  status: z.enum(FILE_STATUSES).nullish(),
  reason: SaidSchema.nullish(),
  belongsTo: z.string().nullish(),
  origin: MediaOriginSchema.nullish(),
});

const LibraryFolderSchema = z.object({
  path: z.string().nullable(),
  parent: z.string().nullable(),
  libraryId: z.string().nullable(),
  libraryPath: z.string().nullable(),
  entries: z.array(LibraryEntrySchema),
  isTruncated: z.boolean(),
});

const LibraryFileSearchSchema = z.object({
  entries: z.array(LibraryEntrySchema),
  isTruncated: z.boolean(),
});

const RenameEntryRequestSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1).max(255),
});

const MoveEntryRequestSchema = z.object({
  path: z.string().min(1),
  into: z.string().min(1),
});

const ChangedEntrySchema = z.object({ path: z.string() });

const MediaPathsSchema = z.object({
  paths: z.record(z.string(), z.string()),
});

const FolderMeasureSchema = z.object({
  sizeBytes: z.number().nonnegative(),
  files: z.number().int().nonnegative(),
  folders: z.number().int().nonnegative(),
  isPartial: z.boolean(),
});

type FolderMeasure = z.infer<typeof FolderMeasureSchema>;
type LibraryEntry = z.infer<typeof LibraryEntrySchema>;
type FileStatus = (typeof FILE_STATUSES)[number];
type LibraryFolder = z.infer<typeof LibraryFolderSchema>;
type LibraryFileSearch = z.infer<typeof LibraryFileSearchSchema>;
type MediaPaths = z.infer<typeof MediaPathsSchema>;

export type {
  FileStatus,
  FolderMeasure,
  LibraryEntry,
  LibraryFileSearch,
  LibraryFolder,
  MediaPaths,
};

export {
  FILE_STATUSES,
  ChangedEntrySchema,
  FolderMeasureSchema,
  LibraryEntrySchema,
  LibraryFileSearchSchema,
  LibraryFolderSchema,
  MediaPathsSchema,
  MoveEntryRequestSchema,
  RenameEntryRequestSchema,
};
