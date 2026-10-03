import { z } from 'zod';

const PeerAskSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stopped'), reason: z.string().max(500) }),
  z.object({ kind: z.literal('paused'), reason: z.string().max(500) }),
  z.object({ kind: z.literal('resumed') }),
  z.object({ kind: z.literal('message'), text: z.string().max(2000) }),
]);

const PeerAsksSchema = z.object({ asks: z.array(PeerAskSchema).max(20) });

type PeerAsk = z.infer<typeof PeerAskSchema>;

export type { PeerAsk };

export { PeerAskSchema, PeerAsksSchema };
