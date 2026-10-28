import { CATALOGUE_BROWSE_KINDS } from '@ValenceContracts/schemas/CatalogueTitle';
import type { CatalogueSearch } from '@ValenceContracts/schemas/CatalogueTitle';

const PREFIX = 'found:';

/**
 * Reads which kind of what a search of Discover found the address is showing, and the words, out
 * of what it carries — `found:film:dune`.
 *
 * @param view - What the address carries, or nothing.
 * @returns The kind and the words, or null where the address names something else.
 */
const readDiscoverFound = (view: string | null): CatalogueSearch | null => {
  if (view === null || !view.startsWith(PREFIX)) {
    return null;
  }

  const rest = view.slice(PREFIX.length);
  const at = rest.indexOf(':');
  const kind = CATALOGUE_BROWSE_KINDS.find((candidate) => candidate === rest.slice(0, at));
  const query = rest.slice(at + 1);

  return at === -1 || kind === undefined || query === '' ? null : { kind, query };
};

export { readDiscoverFound };
