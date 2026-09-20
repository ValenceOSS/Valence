import { describe, expect, it } from 'vitest';
import { libraryKindOf } from './libraryKindOf';
import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * A release filed under the categories given.
 */
const filedUnder = (...categories: number[]): Release => ({
  id: 'x',
  title: 'x',
  indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: null,
  seeders: null,
  leechers: null,
  grabs: null,
  publishedAt: null,
  categories,
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
});

describe('libraryKindOf', () => {
  it('goes by what was searched for', () => {
    expect(libraryKindOf(filedUnder(5040), 'movie')).toBe('movies');
    expect(libraryKindOf(filedUnder(), 'tv')).toBe('shows');
    expect(libraryKindOf(filedUnder(), 'music')).toBe('music');
    expect(libraryKindOf(filedUnder(), 'book')).toBe('books');
  });

  it('goes by the categories the release was filed under, where they agree', () => {
    expect(libraryKindOf(filedUnder(2040, 2000, 100_001), 'search')).toBe('movies');
    expect(libraryKindOf(filedUnder(5070), 'search')).toBe('shows');
    expect(libraryKindOf(filedUnder(3040), 'search')).toBe('music');
    expect(libraryKindOf(filedUnder(7020), 'search')).toBe('books');
  });

  it('says nothing where the categories disagree, say nothing, or are not for a library', () => {
    expect(libraryKindOf(filedUnder(2000, 5000), 'search')).toBeNull();
    expect(libraryKindOf(filedUnder(), 'search')).toBeNull();
    expect(libraryKindOf(filedUnder(4000), 'search')).toBeNull();
    expect(libraryKindOf(filedUnder(8010, 2000), 'search')).toBeNull();
  });
});
