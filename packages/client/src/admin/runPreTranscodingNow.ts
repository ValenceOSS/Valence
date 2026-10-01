import { z } from 'zod';

const RanSchema = z.object({ queued: z.boolean() });

/**
 * Asks for the next pre-transcoded copy to be made now, whatever the hour.
 *
 * @returns Whether a copy is now being made.
 */
const runPreTranscodingNow = async (): Promise<boolean> => {
  const response = await fetch('/api/pre-transcoding/run', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  if (response === null || !response.ok) {
    return false;
  }

  return RanSchema.parse(await response.json()).queued;
};

export { runPreTranscodingNow };
