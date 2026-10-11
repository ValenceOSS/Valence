import { gunzipSync } from 'node:zlib';

const WAITS_MS = 60_000;

/**
 * Reads a playlist or a guide from its address, unzipping one that comes gzipped — as guides often
 * do — and giving up on one larger than it should ever be.
 *
 * @param address - Where it is.
 * @param mostBytes - The most it may be, unzipped.
 * @param fetcher - How a request is sent, injectable for tests.
 * @returns What it says, or nothing where it could not be read.
 */
const readRemoteText = async (
  address: string,
  mostBytes: number,
  fetcher: typeof fetch = fetch,
): Promise<string | null> => {
  try {
    const response = await fetcher(address, { signal: AbortSignal.timeout(WAITS_MS) });

    if (!response.ok) {
      return null;
    }

    const body = Buffer.from(await response.arrayBuffer());
    const isZipped = body[0] === 0x1f && body[1] === 0x8b;
    const text = isZipped ? gunzipSync(body, { maxOutputLength: mostBytes }) : body;

    return text.length > mostBytes ? null : text.toString('utf8');
  } catch {
    return null;
  }
};

export { readRemoteText };
