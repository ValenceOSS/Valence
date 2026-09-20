import type { CatalogueBrowse } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * How an address names a whole list to browse: the kind, the list, and the studio where one was
 * chosen, as `film:popular:2`.
 *
 * @param browsing - Which list, of which kind, and whose studio.
 * @returns What the address carries.
 */
const viewOfBrowsing = (browsing: CatalogueBrowse): string =>
  [browsing.kind, browsing.list, ...(browsing.studio === null ? [] : [browsing.studio])].join(':');

export { viewOfBrowsing };
