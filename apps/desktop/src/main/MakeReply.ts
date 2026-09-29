import { aPasskeyReply } from '@ValenceDesktop/main/aPasskeyReply';
import { PasskeyAttestationSchema } from '@ValenceContracts/schemas/PasskeyAttestation';
import type { z } from 'zod';

const MakeReplySchema = aPasskeyReply(PasskeyAttestationSchema);

type MakeReply = z.infer<typeof MakeReplySchema>;

export type { MakeReply };

export { MakeReplySchema };
