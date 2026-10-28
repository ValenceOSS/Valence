import type { CatalogueSearch } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * How an address names everything a search of Discover found of one kind, as `found:film:dune`.
 *
 * @param searching - The words, and which kind.
 * @returns What the address carries.
 */
const viewOfDiscoverFound = (searching: CatalogueSearch): string =>
  `found:${searching.kind}:${searching.query.trim()}`;

export { viewOfDiscoverFound };
