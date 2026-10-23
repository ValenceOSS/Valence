import { discFolderOf } from '@ValenceServer/library/naming/discFolderOf';
import type { Placement } from './Placement.types';

/**
 * Places a library's files as though each Blu-ray copied whole were one file named for the folder
 * holding its `BDMV`, which is where such a rip says which episode it is, and hands back where each
 * real file belongs.
 *
 * @param place - How the library places its files.
 * @param paths - Every file in the library.
 * @param root - The library's top folder.
 * @returns Where each file belongs, by its real path.
 */
const placedThroughDiscs = (
  place: (paths: readonly string[], root: string) => Map<string, Placement>,
  paths: readonly string[],
  root: string,
): Map<string, Placement> => {
  const taken = new Set(paths);
  const realOf = new Map<string, string>();
  const standIns = paths.map((path) => {
    const disc = discFolderOf(path);
    const standIn = disc === null ? path : `${disc}${path.slice(path.lastIndexOf('.'))}`;

    if (standIn === path || taken.has(standIn) || realOf.has(standIn)) {
      return path;
    }

    realOf.set(standIn, path);

    return standIn;
  });

  if (realOf.size === 0) {
    return place(paths, root);
  }

  const real = (path: string): string => realOf.get(path) ?? path;

  return new Map(
    [...place(standIns, root)].map(([path, placement]) => [
      real(path),
      {
        ...placement,
        extra:
          placement.extra === null
            ? null
            : {
                ...placement.extra,
                parentPath:
                  placement.extra.parentPath === null ? null : real(placement.extra.parentPath),
              },
        version:
          placement.version === null
            ? null
            : { ...placement.version, parentPath: real(placement.version.parentPath) },
      },
    ]),
  );
};

export { placedThroughDiscs };
