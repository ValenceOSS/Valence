import { z } from 'zod';
import { EngineFaultSchema } from './EngineFault';

const PlaybackNoteSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('recovered'),
    mediaId: z.string().min(1).max(200),
    sessionId: z.string().min(1).max(200).nullable(),
    atSeconds: z.number().nonnegative(),
  }),
  z.object({
    kind: z.literal('caughtUp'),
    partyId: z.string().min(1).max(200),
    fromSeconds: z.number().nonnegative(),
    toSeconds: z.number().nonnegative(),
    because: z.enum(['joined', 'drifted']),
  }),
  z
    .object({
      kind: z.literal('engineHandedOver'),
      mediaId: z.string().min(1).max(200),
      sessionId: z.string().min(1).max(200).nullable(),
      atSeconds: z.number().nonnegative(),
    })
    .extend(EngineFaultSchema.shape),
]);

type PlaybackNote = z.infer<typeof PlaybackNoteSchema>;

export type { PlaybackNote };

export { PlaybackNoteSchema };
