import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';

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

    const declared = Number(response.headers.get('content-length') ?? '0');

    if (declared > mostBytes || response.body === null) {
      await response.body?.cancel();

      return null;
    }

    const chunks: Uint8Array[] = [];
    let held = 0;

    const reader = response.body.getReader();

    for (;;) {
      const read = await reader.read();

      if (read.done || !(read.value instanceof Uint8Array)) {
        break;
      }

      held += read.value.length;

      if (held > mostBytes) {
        await reader.cancel();

        return null;
      }

      chunks.push(read.value);
    }

    const body = Buffer.concat(chunks);
    const isZipped = body[0] === 0x1f && body[1] === 0x8b;
    const text = isZipped ? await unzipped(body, { maxOutputLength: mostBytes }) : body;

    return text.length > mostBytes ? null : text.toString('utf8');
  } catch {
    return null;
  }
};

export { readRemoteText };
