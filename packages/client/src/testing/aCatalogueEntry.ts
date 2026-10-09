import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';

/**
 * A film in the library that nobody asked for, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The Catalogue entry.
 */
const aCatalogueEntry = (overrides: Partial<CatalogueEntry> = {}): CatalogueEntry => ({
  key: 'film:1',
  tab: 'films',
  kind: 'film',
  catalogueId: '1',
  title: 'A Film',
  subtitle: null,
  year: 2020,
  art: { kind: 'media', id: 'media-1' },
  posterUrl: null,
  status: 'notFollowed',
  held: 1,
  total: 1,
  isAudio: false,
  requestId: null,
  mediaId: 'media-1',
  libraryId: 'films',
  askedBy: null,
  addedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

export { aCatalogueEntry };
