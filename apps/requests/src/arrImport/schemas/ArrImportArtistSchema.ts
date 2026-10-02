import { z } from 'zod';

const ArrImportArtistSchema = z.object({
  id: z.number().int(),
  foreignArtistId: z.string(),
  artistName: z.string(),
  monitored: z.boolean().default(false),
  path: z.string().nullish(),
  rootFolderPath: z.string().nullish(),
  qualityProfileId: z.number().int().nullish(),
  metadataProfileId: z.number().int().nullish(),
  statistics: z
    .object({
      trackFileCount: z.number().int().default(0),
      trackCount: z.number().int().default(0),
    })
    .nullish(),
});

type ArrImportArtist = z.infer<typeof ArrImportArtistSchema>;

export type { ArrImportArtist };

export { ArrImportArtistSchema };
