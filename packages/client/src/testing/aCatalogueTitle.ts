import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Dune, not in the library and not asked for, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The title, as the catalogue lists it.
 */
const aCatalogueTitle = (overrides: Partial<CatalogueTitle> = {}): CatalogueTitle => ({
  kind: 'film',
  id: '438631',
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: 'A noble family becomes embroiled in a war for control over the most valuable asset.',
  posterUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
  ...overrides,
});

export { aCatalogueTitle };
