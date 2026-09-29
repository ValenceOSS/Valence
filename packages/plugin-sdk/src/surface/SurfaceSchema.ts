import { z } from 'zod';
import { measureSurface } from './measureSurface';
import { PlainTextSchema } from './PlainTextSchema';
import { SURFACE_LIMITS } from './SURFACE_LIMITS';
import { SurfaceBlockSchema } from './SurfaceBlockSchema';

const SurfaceSchema = z
  .object({
    title: PlainTextSchema(SURFACE_LIMITS.labelLength).optional(),
    blocks: z.array(SurfaceBlockSchema).max(200),
  })
  .superRefine((surface, context) => {
    const size = measureSurface(surface.blocks);

    if (size.blocks > SURFACE_LIMITS.blocks) {
      context.addIssue({
        code: 'custom',
        message: `A surface holds at most ${SURFACE_LIMITS.blocks.toString()} blocks`,
      });
    }

    if (size.depth > SURFACE_LIMITS.depth) {
      context.addIssue({
        code: 'custom',
        message: `Sections nest at most ${SURFACE_LIMITS.depth.toString()} deep`,
      });
    }
  });

type Surface = z.infer<typeof SurfaceSchema>;

export type { Surface };

export { SurfaceSchema };
