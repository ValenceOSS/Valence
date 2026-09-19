import { rename, rm } from 'node:fs/promises';

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
 * The encode goes first. Were the order reversed, a failure between the two steps would leave
 * nothing at the film's path at all.
 *
 * @param options - Where the film belongs, and where its original was put.
 * @throws Whatever the filesystem said, where the original could not be put back.
 */
const restoreOriginal = async ({
  originalPath,
  asidePath,
}: RestoreOriginalOptions): Promise<void> => {
  await rm(originalPath, { force: true });
  await rename(asidePath, originalPath);
};

export type { RestoreOriginalOptions };

export { restoreOriginal };
