import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { PublishedReleaseSchema } from './PublishedRelease';
import { DevBuildCheckSchema } from './DevBuildCheck';

const UpdateCheckSchema = z.object({
  current: z.string(),
  latest: z.string().nullable(),
  isNewer: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  url: z.string().url().nullable(),
  history: z.array(PublishedReleaseSchema).default([]),
  checkedAt: z.string().datetime().nullable(),
  isEnabled: z.boolean(),
  problem: SaidSchema.nullable(),
  dev: DevBuildCheckSchema.nullable().default(null),
});

type UpdateCheck = z.infer<typeof UpdateCheckSchema>;

export type { UpdateCheck };

export { UpdateCheckSchema };
