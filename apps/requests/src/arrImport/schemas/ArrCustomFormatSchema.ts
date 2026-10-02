import { z } from 'zod';
import { ArrFieldsSchema } from '@ValenceRequests/arrImport/schemas/ArrFieldsSchema';

const ArrCustomFormatSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  specifications: z
    .array(
      z.object({
        name: z.string().default(''),
        implementation: z.string(),
        negate: z.boolean().default(false),
        required: z.boolean().default(false),
        fields: ArrFieldsSchema,
      }),
    )
    .default([]),
});

type ArrCustomFormat = z.infer<typeof ArrCustomFormatSchema>;

export type { ArrCustomFormat };

export { ArrCustomFormatSchema };
