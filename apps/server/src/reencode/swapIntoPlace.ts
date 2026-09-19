import { rename } from 'node:fs/promises';

type SwapIntoPlaceOptions = {
  originalPath: string;
  encodePath: string;
  asidePath: string;
};

/**
 * Puts the original aside and the encode in its place, in that order and reversibly.
 *
 * The order is the whole of it. The original is not touched until there is a verified encode to put
 * where it was, so every way this can fail leaves the original exactly where it started — and the
 * one step that could fail half way, the second rename, is undone before the failure is reported.
 *
 * Both moves are renames within one directory, which is what makes them instant and atomic. Nothing
 * is copied and nothing is deleted: after this there are two files where there was one, and which
 * of them survives is a decision a person makes later, after watching the result.
 *
 * The encode takes the original's exact path rather than a new one, so `media_item` keeps the row it
 * had. A changed path is a row the scanner removes, and a removed row takes every viewer's watch
 * progress and favourites with it.
 *
 * @param options - The file being replaced, the encode replacing it, and where the original goes.
 * @throws Whatever the filesystem said, with the original already put back.
 */
const swapIntoPlace = async ({
  originalPath,
  encodePath,
  asidePath,
}: SwapIntoPlaceOptions): Promise<void> => {
  await rename(originalPath, asidePath);

  try {
    await rename(encodePath, originalPath);
  } catch (error) {
    await rename(asidePath, originalPath);

    throw error;
  }
};

export type { SwapIntoPlaceOptions };

export { swapIntoPlace };
