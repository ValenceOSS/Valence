import { z } from 'zod';
import type { ParsedChannel } from './ParsedChannel';

const LineupSchema = z.array(
  z.object({
    GuideNumber: z.string(),
    GuideName: z.string().default(''),
    URL: z.string().url(),
    DRM: z.number().optional(),
  }),
);

const WAITS_MS = 10_000;

/**
 * Asks an HDHomeRun tuner which channels it can tune, numbered as it numbers them, each with the
 * address it streams from. Channels it says are copy-protected are left out, since nothing outside
 * the tuner's own apps can play them.
 *
 * @param address - The tuner's address, such as `http://192.168.1.50`.
 * @param fetcher - How a request is sent, injectable for tests.
 * @returns Its channels, or nothing where it could not be asked.
 */
const readTunerLineup = async (
  address: string,
  fetcher: typeof fetch = fetch,
): Promise<ParsedChannel[] | null> => {
  try {
    const response = await fetcher(`${address.replace(/\/+$/u, '')}/lineup.json`, {
      signal: AbortSignal.timeout(WAITS_MS),
    });
    const read = LineupSchema.safeParse(response.ok ? await response.json() : null);

    return read.success
      ? read.data
          .filter((channel) => channel.DRM !== 1)
          .map((channel) => ({
            number: channel.GuideNumber,
            name: channel.GuideName === '' ? channel.GuideNumber : channel.GuideName,
            group: null,
            logoUrl: null,
            guideId: channel.GuideNumber,
            streamUrl: channel.URL,
            userAgent: null,
            referrer: null,
          }))
      : null;
  } catch {
    return null;
  }
};

export { readTunerLineup };
