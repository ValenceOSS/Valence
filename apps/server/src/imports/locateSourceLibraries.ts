import { tidyPath } from './tidyPath';
import type { MediaImportLibrary, PathMapping } from '@ValenceContracts/schemas/MediaImport';
import { libraryLinkKey } from './libraryLinkKey';
import { mapSourcePath } from './mapSourcePath';
import type { SourceLibrary } from './SourceReader';

type ValenceLibraryPlace = {
  id: string;
  path: string;
};

/**
 * Says where each folder of each source library is as Valence sees it, and which Valence library
 * already holds it: one remembered from an earlier import, or one at that folder or inside it.
 *
 * @param sources - The source's libraries.
 * @param mappings - How folders move between the two servers.
 * @param libraries - Valence's libraries.
 * @param links - The libraries an earlier import made, by source folder.
 * @returns Each source library with its folders placed.
 */
const locateSourceLibraries = (
  sources: readonly SourceLibrary[],
  mappings: readonly PathMapping[],
  libraries: readonly ValenceLibraryPlace[],
  links: ReadonlyMap<string, string>,
): MediaImportLibrary[] => {
  const known = new Set(libraries.map((library) => library.id));

  return sources.map((source) => ({
    sourceLibraryId: source.id,
    name: source.name,
    kind: source.kind,
    locations: source.locations.map((sourcePath) => {
      const valencePath = mapSourcePath(sourcePath, mappings);
      const remembered = links.get(libraryLinkKey(source.id, sourcePath));
      const tidied = tidyPath(valencePath);
      const found =
        remembered !== undefined && known.has(remembered)
          ? remembered
          : (libraries.find(
              (library) =>
                tidyPath(library.path) === tidied ||
                tidyPath(library.path).startsWith(`${tidied}/`),
            )?.id ?? null);

      return { sourcePath, valencePath, libraryId: found };
    }),
  }));
};

export type { ValenceLibraryPlace };

export { locateSourceLibraries };
