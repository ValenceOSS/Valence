import { z } from 'zod';

const ArrBlockSchema = z.object({
  id: z.number().int(),
  sourceTitle: z.string().default(''),
  date: z.string().nullish(),
  message: z.string().nullish(),
  movieId: z.number().int().nullish(),
  seriesId: z.number().int().nullish(),
  artistId: z.number().int().nullish(),
});

const ArrBlocklistPageSchema = z.object({
  records: z.array(ArrBlockSchema).default([]),
});

type ArrBlock = z.infer<typeof ArrBlockSchema>;

export type { ArrBlock };

export { ArrBlocklistPageSchema };
