import { sep } from 'node:path';

/**
 * Whether a path is one of a set, or sits beneath one of them.
 *
 * Used to hold back the files a scan could not see. A directory that refused to be read tells us
 * nothing about what is inside it, and treating that silence as "these files are gone" is how a
 * library deletes rows for media that is still sitting on the disk.
 *
 * Matched on whole segments, so `/media/Films` does not cover `/media/Films Archive`. String
 * prefixes alone would, and the two are different folders.
 *
 * @param path - The path being judged.
 * @param roots - The paths that could not be read.
 * @returns Whether this path is covered by one of them.
 */
const isUnderAny = (path: string, roots: readonly string[]): boolean =>
  roots.some((root) => path === root || path.startsWith(`${root}${sep}`));

export { isUnderAny };
