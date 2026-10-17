import { z } from 'zod';

const PublishedReleaseSchema = z.object({
  version: z.string(),
  publishedAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  url: z.string().url(),
  isNewer: z.boolean(),
  isCurrent: z.boolean(),
});

type PublishedRelease = z.infer<typeof PublishedReleaseSchema>;

export type { PublishedRelease };

export { PublishedReleaseSchema };
