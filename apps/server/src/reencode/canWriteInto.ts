import { mkdir, rm, writeFile } from 'node:fs/promises';

const PROBE_NAME = '.valence-write-probe';

/**
 * Whether Valence can actually write into a directory, asked by writing.
 *
 * Mounting media read only is a normal and sensible way to run a media server — the shipped compose
 * file does exactly that — and this feature cannot work under it. The point is to find out now
 * rather than two hours into an encode, and to say so in a sentence naming the folder rather than
 * as an ffmpeg error nobody can act on.
 *
 * Asked by writing rather than by reading permission bits, because the bits are not the whole
 * answer: a read-only mount, a full disk, an ACL, a container running as a user the host directory
 * does not know — every one of those refuses a write while the mode looks fine.
 *
 * @param directory - The directory to test, which is made if it is not there.
 * @returns Whether a file could be created in it.
 */
const canWriteInto = async (directory: string): Promise<boolean> => {
  const probe = `${directory}/${PROBE_NAME}`;

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(probe, '');

    return true;
  } catch {
    return false;
  } finally {
    await rm(probe, { force: true }).catch(() => undefined);
  }
};

export { PROBE_NAME, canWriteInto };
