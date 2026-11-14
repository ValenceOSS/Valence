import { realpath } from 'node:fs/promises';
import { dirname } from 'node:path';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * The real place of a path, with every link in it followed — of the nearest folder above it that is
 * there, where the path itself is not.
 *
 * @param path - The path.
 * @returns Where it really is, or null when nothing of it is there.
 */
const realPlaceOf = async (path: string): Promise<string | null> => {
  const found = await realpath(path).catch(() => null);

  if (found !== null || dirname(path) === path) {
    return found;
  }

  return realPlaceOf(dirname(path));
};

/**
 * Whether a path, once every link along it is followed, is still inside a library's folder, since a
 * link inside a library can lead anywhere on the disk and the name alone does not show it. A path
 * where nothing is yet is judged by the nearest folder above it that is.
 *
 * @param library - The library the path is said to be in.
 * @param path - The path, whose last segment is followed too; ask after a folder above a link to
 * deal with the link itself.
 * @returns Whether it stays inside.
 */
const staysInsideLibrary = async (library: Library, path: string): Promise<boolean> => {
  const [place, root] = await Promise.all([realPlaceOf(path), realPlaceOf(library.path)]);

  return place !== null && root !== null && isUnderAny(place, [root]);
};

export { staysInsideLibrary };
