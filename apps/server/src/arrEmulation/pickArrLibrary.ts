import type { ArrLibrary } from '@ValenceServer/arrEmulation/ArrEmulation';

/**
 * Strips the slashes a folder's path may end with, so that `/media/Films/` and `/media/Films` are
 * the same folder.
 *
 * @param path - The path.
 * @returns The path without them.
 */
const trimmed = (path: string): string => path.replace(/\/+$/, '');

/**
 * The library Overseerr or Jellyseerr chose, by the root folder it was offered as.
 *
 * @param libraries - The libraries that take requests of this kind.
 * @param path - The root folder sent back, if any.
 * @returns The library, or nothing where none is that folder.
 */
const pickArrLibrary = (
  libraries: readonly ArrLibrary[],
  path: string | undefined,
): ArrLibrary | undefined =>
  path === undefined
    ? undefined
    : libraries.find((library) => trimmed(library.path) === trimmed(path));

export { pickArrLibrary };
