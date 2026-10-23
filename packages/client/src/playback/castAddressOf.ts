import { z } from 'zod';

const CastAddressSchema = z.object({ manifestUrl: z.string().min(1) });

/**
 * Asks for an address a device being cast to can read a session by, carrying a ticket in place of
 * the session cookie that device has not got.
 *
 * @param sessionId - The session being cast.
 * @returns The address, or null where none was given.
 */
const castAddressOf = async (sessionId: string): Promise<string | null> => {
  const answer = await fetch(`/api/playback/session/${encodeURIComponent(sessionId)}/cast`, {
    method: 'POST',
  }).catch(() => null);
  const read = answer?.ok === true ? await answer.json().catch(() => null) : null;
  const parsed = CastAddressSchema.safeParse(read);

  return parsed.success ? parsed.data.manifestUrl : null;
};

export { castAddressOf };
