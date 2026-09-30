import { z } from 'zod';
import { SaidValuesSchema } from '@ValenceI18n/SaidSchema';

const RefusalSchema = z.object({
  error: z.string(),
  code: z.string().nullable().default(null),
  values: SaidValuesSchema.default({}),
});

export { RefusalSchema };
