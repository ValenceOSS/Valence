import { z } from 'zod';
import { SurfaceActionSchema } from './SurfaceActionSchema';

const SurfaceActRequestSchema = z.object({
  action: SurfaceActionSchema,
  fields: z
    .record(
      z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/),
      z.union([z.string().max(2000), z.boolean()]),
    )
    .refine((fields) => Object.keys(fields).length <= 60, 'At most 60 fields are sent'),
});

type SurfaceActRequest = z.infer<typeof SurfaceActRequestSchema>;

export type { SurfaceActRequest };

export { SurfaceActRequestSchema };
