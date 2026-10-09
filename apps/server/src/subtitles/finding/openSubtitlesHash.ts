import { open } from 'node:fs/promises';

const CHUNK = 64 * 1024;

const WRAP = 2n ** 64n;

/**
 * Adds a stretch of a file into a running sum, as unsigned 64-bit little-endian words.
 *
 * @param sum - The sum so far.
 * @param bytes - The stretch.
 * @returns The new sum, wrapped at 64 bits.
 */
const addWords = (sum: bigint, bytes: Buffer): bigint => {
  let next = sum;

  for (let at = 0; at + 8 <= bytes.length; at += 8) {
    next = (next + bytes.readBigUInt64LE(at)) % WRAP;
  }

  return next;
};

/**
 * The hash OpenSubtitles keeps a subtitle's video under: the file's size plus its first and last
 * sixty-four kilobytes, read as 64-bit words and summed. A subtitle found by it was timed against
 * this very release, so it lines up, where one found by the title alone may not.
 *
 * @param path - The video.
 * @returns The hash, as sixteen hex digits, or nothing where the file cannot be read or is too
 *   small to have one.
 */
const openSubtitlesHash = async (path: string): Promise<string | null> => {
  const file = await open(path, 'r').catch(() => null);

  if (file === null) {
    return null;
  }

  try {
    const { size } = await file.stat();

    if (size < CHUNK * 2) {
      return null;
    }

    const head = Buffer.alloc(CHUNK);
    const tail = Buffer.alloc(CHUNK);

    await file.read(head, 0, CHUNK, 0);
    await file.read(tail, 0, CHUNK, size - CHUNK);

    return addWords(addWords(BigInt(size) % WRAP, head), tail)
      .toString(16)
      .padStart(16, '0');
  } catch {
    return null;
  } finally {
    await file.close();
  }
};

export { openSubtitlesHash };
