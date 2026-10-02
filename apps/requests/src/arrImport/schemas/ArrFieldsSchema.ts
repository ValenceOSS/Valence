import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';

const ArrFieldsSchema = z
  .array(z.object({ name: z.string(), value: JsonValueSchema.optional() }))
  .default([]);

type ArrFields = z.infer<typeof ArrFieldsSchema>;

export type { ArrFields };

export { ArrFieldsSchema };
