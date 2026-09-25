import { isIgnoredPath } from '@ValenceServer/library/naming/isIgnoredPath';

/**
 * Whether a file is one a library reads, judged from the library's top folder down, so a library
 * that lives under a hidden folder is not ignored whole.
 *
 * @param path - The file's path.
 * @param root - The library's top folder.
 * @returns Whether it belongs in the library.
 */
const isOrdinaryPath = (path: string, root: string): boolean =>
  !isIgnoredPath(path.startsWith(`${root}/`) ? path.slice(root.length) : path);

export { isOrdinaryPath };
