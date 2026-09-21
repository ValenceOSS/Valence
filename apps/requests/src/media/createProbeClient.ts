import { ProbedMediaSchema } from '@ValenceRequests/media/ProbedMedia';
import type { ProbedMedia } from '@ValenceRequests/media/ProbedMedia';

type ProbeClient = (path: string) => Promise<ProbedMedia | null>;

const PROBE_TIMEOUT_MS = 30_000;

/**
 * Asks the transcoder what a file actually is, which is the only way to know rather than guess.
 *
 * A release name is what an uploader chose to type. It is usually right and sometimes a lie, and it
 * is silent about anything the encoder did that the uploader did not mention. The transcoder
 * already runs ffprobe for everything else, so it is asked here too rather than a second copy of
 * ffmpeg being put in this service.
 *
 * Nothing depends on the answer arriving. Where no transcoder is configured, where it cannot be
 * reached, or where it will not read the file, nothing is returned and the caller falls back to
 * what the name said.
 *
 * @param address - Where the transcoder is, or empty where there is none.
 * @param fetcher - How to make the request.
 * @returns A function that probes one file.
 */
const createProbeClient = (address: string, fetcher: typeof fetch = fetch): ProbeClient => {
  if (address === '') {
    return () => Promise.resolve(null);
  }

  return async (path) => {
    try {
      const answer = await fetcher(`${address}/probe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path }),
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });

      if (!answer.ok) {
        return null;
      }

      const read = ProbedMediaSchema.safeParse(await answer.json());

      return read.success ? read.data : null;
    } catch {
      return null;
    }
  };
};

export type { ProbeClient };

export { createProbeClient };
