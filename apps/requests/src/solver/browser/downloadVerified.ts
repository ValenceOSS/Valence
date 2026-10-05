import { createHash } from 'node:crypto';

/**
 * Downloads a file and checks it against the SHA-256 it is pinned to, so a file swapped or damaged
 * on the way is refused rather than installed.
 *
 * @param url - Where the file is.
 * @param sha256 - The checksum it is pinned to, in hex.
 * @returns The file's bytes.
 * @throws If the download fails or the file is not the one pinned.
 */
const downloadVerified = async (url: string, sha256: string): Promise<Buffer> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}.`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = createHash('sha256').update(bytes).digest('hex');

  if (digest !== sha256) {
    throw new Error(`${url} is not the file pinned: its SHA-256 is ${digest}, not ${sha256}.`);
  }

  return bytes;
};

export { downloadVerified };
