import type { CatalogueShelf, CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const HERO_PAIRS = 3;

/**
 * The titles Discover's hero leads with: the first few trending films and trending series, taken in
 * turn, so the top of Discover is never all films or all programmes.
 *
 * @param shelves - Discover's shelves.
 * @returns The titles to feature, in the order they take the screen.
 */
const discoverHeroTitles = (shelves: readonly CatalogueShelf[]): CatalogueTitle[] => {
  const films = shelves.find((shelf) => shelf.id === 'trending-films')?.titles ?? [];
  const series = shelves.find((shelf) => shelf.id === 'trending-series')?.titles ?? [];

  return Array.from({ length: HERO_PAIRS }, (_, at) => [films[at], series[at]])
    .flat()
    .filter((title) => title !== undefined);
};

export { discoverHeroTitles };
