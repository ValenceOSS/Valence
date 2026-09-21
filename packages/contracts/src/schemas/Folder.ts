import { z } from 'zod';

const FolderSchema = z.object({
  name: z.string(),
  path: z.string(),
});

const FolderListingSchema = z.object({
  path: z.string().nullable(),
  parent: z.string().nullable(),
  folders: z.array(FolderSchema),
  isTruncated: z.boolean(),
});

const CreateFolderRequestSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1).max(255),
});

export type CreateFolderRequest = z.infer<typeof CreateFolderRequestSchema>;
export type Folder = z.infer<typeof FolderSchema>;
export type FolderListing = z.infer<typeof FolderListingSchema>;

export { CreateFolderRequestSchema, FolderSchema, FolderListingSchema };
