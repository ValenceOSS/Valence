import { z } from 'zod';

const LibraryEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  isFolder: z.boolean(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  modifiedAt: z.string().datetime().nullable(),
  mediaId: z.string().nullable(),
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
type LibraryFolder = z.infer<typeof LibraryFolderSchema>;
type LibraryFileSearch = z.infer<typeof LibraryFileSearchSchema>;
type MediaPaths = z.infer<typeof MediaPathsSchema>;

export type { FolderMeasure, LibraryEntry, LibraryFileSearch, LibraryFolder, MediaPaths };

export {
  ChangedEntrySchema,
  FolderMeasureSchema,
  LibraryEntrySchema,
  LibraryFileSearchSchema,
  LibraryFolderSchema,
  MediaPathsSchema,
  MoveEntryRequestSchema,
  RenameEntryRequestSchema,
};
