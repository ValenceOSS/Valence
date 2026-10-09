import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Dune as its own page shows it, not in the library and not asked for, with anything a test cares
 * about changed.
 *
 * @param overrides - What to change.
 * @returns The title in full.
 */
const aCatalogueTitleDetail = (
  overrides: Partial<CatalogueTitleDetail> = {},
): CatalogueTitleDetail => ({
  ...aCatalogueTitle(),
  musicBrainzId: null,
  backdropUrl: null,
  genres: ['Science Fiction'],
  runtimeMinutes: 155,
  cast: [],
  albums: [],
  authors: [],
  tracks: [],
  label: null,
  trailerKey: null,
  ...overrides,
});

export { aCatalogueTitleDetail };
