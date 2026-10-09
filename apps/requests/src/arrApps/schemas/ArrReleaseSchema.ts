import { z } from 'zod';

const ArrReleaseSchema = z.object({
  guid: z.string().min(1),
  title: z.string().default(''),
  indexerId: z.number().int(),
  indexer: z.string().default(''),
  protocol: z.string().default('torrent'),
  size: z.number().nonnegative().nullish(),
  seeders: z.number().int().nonnegative().nullish(),
  leechers: z.number().int().nonnegative().nullish(),
  publishDate: z.string().nullish(),
  downloadUrl: z.string().nullish(),
  infoUrl: z.string().nullish(),
  rejected: z.boolean().default(false),
  rejections: z.array(z.string()).default([]),
  qualityWeight: z.number().int().nonnegative().nullish(),
  customFormatScore: z.number().int().nullish(),
});

type ArrRelease = z.infer<typeof ArrReleaseSchema>;

export type { ArrRelease };

export { ArrReleaseSchema };
