import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * A torrent an indexer found under the name given, with anything a test cares about changed.
 *
 * @param title - Its name.
 * @param overrides - What to change.
 * @returns The release.
 */
const aRelease = (title: string, overrides: Partial<Release> = {}): Release => ({
  id: title,
  title,
  indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  indexerName: 'AnimeTracker',
  protocol: 'torrent',
  sizeBytes: null,
  seeders: null,
  leechers: null,
  grabs: null,
  publishedAt: null,
  categories: [],
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
