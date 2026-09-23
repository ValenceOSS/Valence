import { z } from 'zod';
import { MusicCommandSchema } from '@ValenceContracts/schemas/MusicRemote';
import { VideoCommandSchema } from '@ValenceContracts/schemas/VideoRemote';

const PresenceEventSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stopped'), reason: z.string() }),
  z.object({ kind: z.literal('paused'), reason: z.string() }),
  z.object({ kind: z.literal('resumed') }),
  z.object({ kind: z.literal('message'), text: z.string().min(1) }),
  z.object({
    kind: z.literal('music'),
    command: MusicCommandSchema,
    fromClientId: z.string(),
    fromLabel: z.string(),
  }),
  z.object({
    kind: z.literal('video'),
    command: VideoCommandSchema,
    fromClientId: z.string(),
    fromLabel: z.string(),
  }),
]);

type PresenceEvent = z.infer<typeof PresenceEventSchema>;

export type { PresenceEvent };

export { PresenceEventSchema };
