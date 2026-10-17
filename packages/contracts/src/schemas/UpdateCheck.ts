import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';

const UpdateCheckSchema = z.object({
  current: z.string(),
  latest: z.string().nullable(),
  isNewer: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  url: z.string().url().nullable(),
  checkedAt: z.string().datetime().nullable(),
  isEnabled: z.boolean(),
  problem: SaidSchema.nullable(),
});

type UpdateCheck = z.infer<typeof UpdateCheckSchema>;

export type { UpdateCheck };

export { UpdateCheckSchema };
