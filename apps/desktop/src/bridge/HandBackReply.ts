import { z } from 'zod';
import { aPasskeyReply } from '@ValenceDesktop/bridge/aPasskeyReply';

const HandBackReplySchema = aPasskeyReply(z.string().min(1));

type HandBackReply = z.infer<typeof HandBackReplySchema>;

export type { HandBackReply };

export { HandBackReplySchema };
