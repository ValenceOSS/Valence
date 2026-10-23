import { rename } from 'node:fs/promises';

type RestoreOriginalOptions = {
  originalPath: string;
  asidePath: string;
};

/**
 * Puts the original back and throws the encode away, for somebody who watched it and said no.
 *
 * One action rather than a file operation an administrator performs by hand, which is the point:
 * rejecting has to be as easy as confirming, or the pressure is on saying yes. Undoing
 * [`swapIntoPlace`] exactly, so the film is at the path it was at, under the row it was under, with
 * the watch progress it had.
 *
 * The original is moved over the encode in one rename, which replaces it whole, so there is never a
 * moment with nothing at the film's path, and asking twice cannot remove the film the first put back:
 * the second finds nothing set aside and fails, leaving the film where it is.
 *
 * @param options - Where the film belongs, and where its original was put.
 * @throws Whatever the filesystem said, where the original could not be put back.
 */
const restoreOriginal = async ({
  originalPath,
  asidePath,
}: RestoreOriginalOptions): Promise<void> => {
  await rename(asidePath, originalPath);
};

export type { RestoreOriginalOptions };

export { restoreOriginal };
