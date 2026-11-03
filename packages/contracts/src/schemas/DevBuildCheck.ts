import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';

const DevCommitSchema = z.object({
  sha: z.string(),
  subject: z.string(),
  committedAt: z.string().datetime().nullable(),
  url: z.string().url(),
});

const DevBuildCheckSchema = z.object({
  commit: z.string(),
  newest: z.string().nullable(),
  builtAt: z.string().datetime().nullable(),
  isNewer: z.boolean(),
  isOffMain: z.boolean().default(false),
  behindBy: z.number().int().nonnegative(),
  commits: z.array(DevCommitSchema),
  problem: SaidSchema.nullable(),
});

type DevCommit = z.infer<typeof DevCommitSchema>;
type DevBuildCheck = z.infer<typeof DevBuildCheckSchema>;

export type { DevBuildCheck, DevCommit };

export { DevBuildCheckSchema, DevCommitSchema };
