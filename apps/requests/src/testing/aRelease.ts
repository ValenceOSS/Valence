import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * A torrent of the name given, found by one indexer and seeded, with anything a test cares about
 * changed.
 *
 * @param title - Its name, which is its id too.
 * @param overrides - What to change.
 * @returns The release.
 */
const aRelease = (title: string, overrides: Partial<Release> = {}): Release => ({
  id: title,
  title,
  indexerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: null,
  seeders: 10,
  leechers: 1,
  grabs: null,
  publishedAt: null,
  categories: [2000],
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
  ...overrides,
});

export { aRelease };
