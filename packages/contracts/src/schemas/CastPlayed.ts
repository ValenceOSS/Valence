import { z } from 'zod';

const CastPlayedSchema = z.object({
  seconds: z.number().nonnegative(),
  isPlaying: z.boolean(),
});

export type CastPlayed = z.infer<typeof CastPlayedSchema>;
export { CastPlayedSchema };
