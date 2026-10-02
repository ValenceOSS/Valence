import { z } from 'zod';
import { ArrFieldsSchema } from '@ValenceRequests/arrImport/schemas/ArrFieldsSchema';

const ArrProviderSchema = z.object({
  id: z.number().int(),
  name: z.string().default(''),
  enable: z.boolean().default(true),
  protocol: z.string().default('unknown'),
  priority: z.number().int().default(1),
  implementation: z.string(),
  tags: z.array(z.number().int()).default([]),
  fields: ArrFieldsSchema,
});

type ArrProvider = z.infer<typeof ArrProviderSchema>;

export type { ArrProvider };

export { ArrProviderSchema };
