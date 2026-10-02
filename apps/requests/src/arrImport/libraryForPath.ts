import type { ArrImportLibrary, ArrPathMapping } from '@ValenceContracts/schemas/ArrImport';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import { isWithin } from '@ValenceRequests/arrImport/isWithin';
import { mapArrPath } from '@ValenceRequests/arrImport/mapArrPath';

type LibraryFound = { library: ArrImportLibrary; isGuessed: boolean };

/**
 * The last part of a path, as it is compared for a guess.
 *
 * @param path - The path.
 * @returns Its last part, in lower case.
 */
const lastPartOf = (path: string): string =>
  (path.replace(/\/+$/, '').split('/').at(-1) ?? '').toLowerCase();

/**
 * Which of Valence's libraries of a kind holds a folder an app keeps media in, once the path is
 * written as Valence sees it: the library the folder is in or holds, the deepest such one where
 * several are — or, where none is, the one library whose folder ends in the same name, as a guess.
 *
 * @param path - The folder, as the app sees it.
 * @param kind - The kind of library it can be.
 * @param libraries - Valence's libraries.
 * @param mappings - Where the app's folders are, as the admin said.
 * @returns The library and whether it was guessed, or null.
 */
const libraryForPath = (
  path: string,
  kind: LibraryKind,
  libraries: readonly ArrImportLibrary[],
  mappings: readonly ArrPathMapping[],
): LibraryFound | null => {
  const mapped = mapArrPath(path, mappings);
  const ofKind = libraries.filter((library) => library.kind === kind);
  const placed = ofKind
    .flatMap((library) =>
      [library.path, library.requestPath]
        .filter((folder): folder is string => folder !== null && folder !== '')
        .filter((folder) => isWithin(mapped, folder) || isWithin(folder, mapped))
        .map((folder) => ({ library, depth: folder.length })),
    )
    .toSorted((left, right) => right.depth - left.depth)[0];

  if (placed !== undefined) {
    return { library: placed.library, isGuessed: false };
  }

  const named = ofKind.filter(
    (library) => lastPartOf(library.path) !== '' && lastPartOf(library.path) === lastPartOf(path),
  );
  const [only] = named;

  return named.length === 1 && only !== undefined ? { library: only, isGuessed: true } : null;
};

export type { LibraryFound };

export { libraryForPath };
