import { describe, expect, it } from 'vitest';
import { idsTakenBy } from './idsTakenBy';
import type { IndexerCapabilities } from '@ValenceContracts/schemas/Indexer';

const CAPABLE: IndexerCapabilities = {
  categories: [],
  modes: [
    { mode: 'search', parameters: ['q'] },
    { mode: 'movie', parameters: ['q', 'imdbid'] },
    { mode: 'tv', parameters: ['q', 'tvdbid'] },
  ],
  limit: null,
};

describe('idsTakenBy', () => {
  it('names the ids the indexer takes for the kind of search', () => {
    expect(idsTakenBy({ mode: 'movie', imdbId: 'tt1160419', tmdbId: 438631 }, CAPABLE)).toEqual({
      imdbid: '1160419',
    });
    expect(idsTakenBy({ mode: 'tv', tvdbId: 371980 }, CAPABLE)).toEqual({ tvdbid: '371980' });
  });

  it('names none for a plain search, or an indexer that never said', () => {
    expect(idsTakenBy({ mode: 'search', tvdbId: 1 }, CAPABLE)).toEqual({});
    expect(idsTakenBy({ mode: 'tv', tvdbId: 1 }, null)).toEqual({});
  });
});
