import { z } from 'zod';
import { SUBTITLE_SOURCES } from '@ValenceContracts/constants/SUBTITLE_SOURCES';

const FetchedSubtitleEntrySchema = z.object({
  file: z.string().min(1),
  language: z.string(),
  source: z.enum(SUBTITLE_SOURCES),
  id: z.string(),
  release: z.string(),
  score: z.number().int(),
  isHearingImpaired: z.boolean(),
  format: z.string(),
  fetchedAt: z.string(),
});

type FetchedSubtitleEntry = z.infer<typeof FetchedSubtitleEntrySchema>;

export type { FetchedSubtitleEntry };

export { FetchedSubtitleEntrySchema };
