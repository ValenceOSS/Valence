import { z } from 'zod';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';

const CastAddressSchema = z.object({ address: z.string().min(1) });

/**
 * Asks for an address a device being cast to can stream a track from, carrying a ticket in place of
 * the session cookie that device has not got.
 *
 * @param trackId - The track being cast.
 * @param quality - How much of it to send.
 * @returns The address, or null where none was given.
 */
const castTrackAddressOf = async (
  trackId: string,
  quality: AudioQuality,
): Promise<string | null> => {
  const answer = await fetch(
    `/api/music/tracks/${encodeURIComponent(trackId)}/cast?quality=${quality}`,
    { method: 'POST' },
  ).catch(() => null);
  const read = answer?.ok === true ? await answer.json().catch(() => null) : null;
  const parsed = CastAddressSchema.safeParse(read);

  return parsed.success ? parsed.data.address : null;
};

export { castTrackAddressOf };
