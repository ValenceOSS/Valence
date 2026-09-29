import { z } from 'zod';

/**
 * The shape of what this process answers the window with after asking for a passkey: what came of
 * it, that somebody cancelled, or why it failed.
 *
 * An answer rather than a throw, because a throw crosses to the window as an error whose message is
 * wrapped in Electron's own words about invoking a remote method, which is no use to put on a screen.
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
