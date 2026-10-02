import { z } from 'zod';

const ArrImportRootFolderSchema = z.object({
  id: z.number().int(),
  path: z.string(),
  defaultQualityProfileId: z.number().int().nullish(),
  defaultMetadataProfileId: z.number().int().nullish(),
});

type ArrImportRootFolder = z.infer<typeof ArrImportRootFolderSchema>;

export type { ArrImportRootFolder };

export { ArrImportRootFolderSchema };
