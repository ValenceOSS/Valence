import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import { readBodyUpTo } from '@ValenceCore/network/readBodyUpTo';

const WAITS_MS = 60_000;

const unzipped = promisify(gunzip);

/**
 * Reads a playlist or a guide from its address, unzipping one that comes gzipped — as guides often
 * do — and giving up on one larger than it should ever be, as soon as it is seen to be, rather than
 * after the whole of it has been taken in.
 *
 * @param address - Where it is.
 * @param mostBytes - The most it may be, unzipped, and the most that is read of it zipped.
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

    const read = await readBodyUpTo(response, mostBytes);

    if (read === null) {
      return null;
    }

    const body = Buffer.from(read);
    const isZipped = body[0] === 0x1f && body[1] === 0x8b;
    const text = isZipped ? await unzipped(body, { maxOutputLength: mostBytes }) : body;

    return text.length > mostBytes ? null : text.toString('utf8');
  } catch {
    return null;
  }
};

export { readRemoteText };
