import { describe, expect, it } from 'vitest';
import { searchParametersFor } from './searchParametersFor';
import type { IndexerCapabilities } from '@ValenceContracts/schemas/Indexer';

const CAPABLE: IndexerCapabilities = {
  categories: [],
  modes: [
    { mode: 'search', parameters: ['q'] },
    { mode: 'movie', parameters: ['q', 'imdbid'] },
    { mode: 'tv', parameters: ['q', 'season', 'ep', 'tvdbid'] },
  ],
  limit: 100,
};

describe('searchParametersFor', () => {
  it('asks a plain search with the words', () => {
    expect(searchParametersFor({ query: 'dune' }, CAPABLE, [])).toEqual({
      t: 'search',
      q: 'dune',
      limit: '100',
    });
  });

  it('asks for a film by the ids the indexer takes, and not the ones it does not', () => {
    expect(
      searchParametersFor({ mode: 'movie', imdbId: 'tt1375666', tmdbId: 27205 }, CAPABLE, []),
    ).toEqual({ t: 'movie', imdbid: '1375666', limit: '100' });
  });

  it('asks for an episode by season and number', () => {
    expect(
      searchParametersFor({ mode: 'tv', query: 'severance', season: 2, episode: 3 }, CAPABLE, []),
    ).toEqual({ t: 'tvsearch', q: 'severance', season: '2', ep: '3', limit: '100' });
  });

  it('falls back to a plain search where the indexer cannot do the kind asked for', () => {
    expect(
      searchParametersFor({ mode: 'music', query: 'blur', artist: 'Blur' }, CAPABLE, []),
    ).toEqual({ t: 'search', q: 'blur', limit: '100' });
  });

  it('sends everything to an indexer that never said what it can do', () => {
    expect(
      searchParametersFor(
        { mode: 'music', query: 'parklife', artist: 'Blur', album: 'Parklife' },
        null,
        [],
      ),
    ).toEqual({ t: 'music', q: 'parklife', artist: 'Blur', album: 'Parklife' });
  });

  it('narrows to the indexer’s own categories, unless the search names some', () => {
    expect(searchParametersFor({ query: 'x' }, null, [2000, 5000]).cat).toBe('2000,5000');
    expect(searchParametersFor({ query: 'x', categories: [3000] }, null, [2000]).cat).toBe('3000');
    expect(searchParametersFor({ query: 'x' }, null, []).cat).toBeUndefined();
  });

  it('leaves the words out of an id search that has none', () => {
    expect(
      searchParametersFor({ mode: 'movie', query: '', imdbId: 'tt1' }, null, []).q,
    ).toBeUndefined();
  });
});
