import { folderOf } from './folderOf';

const PART_FOLDER = /^(?:(?:season|series|cd|disc|disk)\s*\d+|specials|s\d+)$/i;

/**
 * The folder a series or an album lives in, from where its files are: the deepest folder they all
 * share, stepped up out of a season's or a disc's folder where every file is in the one of them.
 *
 * @param paths - Its episodes' or tracks' files.
 * @returns Its folder, or null where it has no files.
 */
const titleFolderOf = (paths: readonly string[]): string | null => {
  const [first, ...rest] = paths.map(folderOf);

  if (first === undefined) {
    return null;
  }

  let shared = first;

  for (const folder of rest) {
    while (
      shared !== folder &&
      !folder.startsWith(`${shared}/`) &&
      !folder.startsWith(`${shared}\\`)
    ) {
      const up = folderOf(shared);

      if (up === shared) {
        return shared;
      }

      shared = up;
    }
  }

  const name = shared.slice(Math.max(shared.lastIndexOf('/'), shared.lastIndexOf('\\')) + 1);

  return PART_FOLDER.test(name) ? folderOf(shared) : shared;
};

export { titleFolderOf };
