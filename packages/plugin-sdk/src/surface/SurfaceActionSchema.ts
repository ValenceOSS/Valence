import { z } from 'zod';
import { SURFACE_LIMITS } from './SURFACE_LIMITS';

const SurfaceActionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9._-]{0,63}$/),
  payload: z
    .record(z.string().max(64), z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]))
    .refine(
      (payload) => JSON.stringify(payload).length <= SURFACE_LIMITS.payloadBytes,
      'An action carries at most 4 KB',
    )
    .optional(),
  confirm: z.string().max(200).optional(),
});

type SurfaceAction = z.infer<typeof SurfaceActionSchema>;

export type { SurfaceAction };

export { SurfaceActionSchema };
