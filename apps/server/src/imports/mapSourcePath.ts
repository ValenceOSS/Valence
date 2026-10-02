import { tidyPath } from './tidyPath';
import type { PathMapping } from '@ValenceContracts/schemas/MediaImport';

/**
 * Moves a path as the source sees it to where the same file is as Valence sees it, by the longest
 * mapping whose source folder holds it.
 *
 * @param path - The path on the source.
 * @param mappings - The folders the administrator said move, and where to.
 * @returns The path as Valence sees it, unchanged where no mapping holds it.
 */
const mapSourcePath = (path: string, mappings: readonly PathMapping[]): string => {
  const tidied = tidyPath(path);
  const best = mappings
    .map((mapping) => ({ from: tidyPath(mapping.from), to: tidyPath(mapping.to) }))
    .filter(
      (mapping) =>
        mapping.from !== '' && (tidied === mapping.from || tidied.startsWith(`${mapping.from}/`)),
    )
    .sort((one, other) => other.from.length - one.from.length)[0];

  if (best === undefined) {
    return tidied === '' ? path : tidied;
  }

  return `${best.to}${tidied.slice(best.from.length)}`;
};

export { mapSourcePath };
