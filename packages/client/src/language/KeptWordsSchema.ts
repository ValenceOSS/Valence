import { z } from 'zod';

const KeptWordsSchema = z.object({
  language: z.string(),
  fetchedAt: z.number(),
  words: z.record(z.string(), z.string()),
});

type KeptWords = z.infer<typeof KeptWordsSchema>;

export { KeptWordsSchema };
export type { KeptWords };
