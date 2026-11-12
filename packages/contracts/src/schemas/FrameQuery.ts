import { z } from 'zod';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';

const FrameQuerySchema = z.object({
  zoom: z.coerce.number().min(1).max(MOST_FRAME_ZOOM).optional(),
  x: z.coerce.number().min(-1).max(1).optional(),
  y: z.coerce.number().min(-1).max(1).optional(),
});

type FrameQuery = z.infer<typeof FrameQuerySchema>;

export type { FrameQuery };

export { FrameQuerySchema };
