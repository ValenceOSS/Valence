import { z } from '@hono/zod-openapi';

const PlaybackHealthSchema = z.object({
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  bufferedAheadSeconds: z.number().nonnegative(),
  presentedWidth: z.number().int().nonnegative(),
  presentedHeight: z.number().int().nonnegative(),
});

export { PlaybackHealthSchema };
