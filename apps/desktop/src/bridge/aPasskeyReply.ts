import { z } from 'zod';

/**
 * Describes what the host answers after asking for a passkey: what came of it, that somebody cancelled, or why it failed.
 *
 * @param done - What came of it, where it worked.
 * @returns The schema.
 */
const aPasskeyReply = <Done extends z.ZodType>(done: Done) =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('done'), done }),
    z.object({ kind: z.literal('cancelled') }),
    z.object({ kind: z.literal('failed'), reason: z.string() }),
  ]);

export { aPasskeyReply };
