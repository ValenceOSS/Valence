import { aPasskeyReply } from '@ValenceDesktop/main/aPasskeyReply';
import { PasskeyAssertionSchema } from '@ValenceContracts/schemas/PasskeyAssertion';
import type { z } from 'zod';

const AskReplySchema = aPasskeyReply(PasskeyAssertionSchema);

type AskReply = z.infer<typeof AskReplySchema>;

export type { AskReply };

export { AskReplySchema };
