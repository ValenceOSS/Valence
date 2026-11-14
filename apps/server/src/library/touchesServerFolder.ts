import { realpath } from 'node:fs/promises';
import { basename, dirname, join, parse, resolve } from 'node:path';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';

/**
 * The real place of a folder, or where it would be if it is not there: the real place of the nearest
 * folder above it that is, with the rest of the path after it.
 *
 * @param path - The folder.
 * @returns Where it is.
 */
const placeOf = async (path: string): Promise<string> => {
  const whole = resolve(path);
  const found = await realpath(whole).catch(() => null);

  if (found !== null || dirname(whole) === whole) {
    return found ?? whole;
  }

  return join(await placeOf(dirname(whole)), basename(whole));
};

/**
 * Whether a folder is, holds or sits inside any of the folders the server keeps its own data in,
 * so that a library is never rooted on its database dumps, its settings or its caches. A drive's
 * own root holds them all.
 *
 * @param path - The folder a library would be made on.
 * @param serverFolders - The folders the server keeps its own data in.
 * @returns Whether it touches one.
 */
const touchesServerFolder = async (
  path: string,
  serverFolders: readonly string[],
): Promise<boolean> => {
  const here = await placeOf(path);
  const kept = await Promise.all(serverFolders.map(placeOf));

  return (
    (kept.length > 0 && parse(here).root === here) ||
    kept.some((folder) => isUnderAny(folder, [here]) || isUnderAny(here, [folder]))
  );
};

export { touchesServerFolder };
