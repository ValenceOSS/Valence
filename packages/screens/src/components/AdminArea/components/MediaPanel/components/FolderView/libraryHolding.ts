import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * Which library a file or folder is in, by whose folder holds it. Matched on whole segments, so a
 * library at `/media/Films` does not hold `/media/Films Archive`, and the deepest library wins where
 * one sits inside another.
 *
 * @param path - The file or folder.
 * @param libraries - The libraries there are.
 * @returns The library holding it, or null where none does or it is a library's own folder.
 */
const libraryHolding = (path: string, libraries: readonly Library[]): Library | null =>
  libraries
    .filter((library) => {
      const root = library.path.replace(/[\\/]+$/u, '');

      return path.startsWith(`${root}/`) || path.startsWith(`${root}\\`);
    })
    .sort((first, second) => second.path.length - first.path.length)[0] ?? null;

export { libraryHolding };
