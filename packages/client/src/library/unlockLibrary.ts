import { z } from 'zod';

const UnlockedSchema = z.object({ untilMs: z.number().nullable() });

type Unlocking =
  | { kind: 'unlocked'; untilMs: number | null }
  | { kind: 'wrong' }
  | { kind: 'tooMany' }
  | { kind: 'failed' };

/**
 * Unlocks a locked library on this device for as long as its lock allows, with its password or PIN.
 * The server remembers it in a cookie of its own, so nothing here has to carry it afterwards.
 *
 * @param libraryId - The library.
 * @param secret - Its password or PIN.
 * @returns Whether it opened and until when, or why it did not.
 */
const unlockLibrary = async (libraryId: string, secret: string): Promise<Unlocking> => {
  const response = await fetch(`/api/libraries/${encodeURIComponent(libraryId)}/unlock`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret }),
  }).catch(() => null);

  if (response === null) {
    return { kind: 'failed' };
  }

  if (response.status === 403) {
    return { kind: 'wrong' };
  }

  if (response.status === 429) {
    return { kind: 'tooMany' };
  }

  const read = UnlockedSchema.safeParse(await response.json().catch(() => null));

  return response.ok && read.success
    ? { kind: 'unlocked', untilMs: read.data.untilMs }
    : { kind: 'failed' };
};

export type { Unlocking };

export { unlockLibrary };
