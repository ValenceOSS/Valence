import { z } from 'zod';

const PlaybackEngineErrorSchema = z.object({
  category: z.number().int(),
  code: z.number().int().optional(),
});

export { PlaybackEngineErrorSchema };
