import { describe, expect, it } from 'vitest';
import { queryVariables } from './queryVariables';

describe('queryVariables', () => {
  it('describes a plain search', () => {
    expect(queryVariables({ query: ' dune ' })).toMatchObject({
      '.Query.Type': 'search',
      '.Query.Q': 'dune',
      '.Query.Keywords': 'dune',
      '.Query.IsSearch': 'True',
      '.Query.IsRssSearch': null,
      '.Query.IsIdSearch': null,
    });
  });

  it('describes a search for an episode, adding it to the keywords', () => {
    expect(
      queryVariables({ query: 'severance', mode: 'tv', season: 2, episode: 3, tvdbId: 371980 }),
    ).toMatchObject({
      '.Query.Type': 'tvsearch',
      '.Query.Keywords': 'severance S02E03',
      '.Query.Episode': 'S02E03',
      '.Query.Season': '2',
      '.Query.Ep': '3',
      '.Query.TVDBID': '371980',
      '.Query.IsTVSearch': 'True',
      '.Query.IsTvdbQuery': 'True',
      '.Query.IsIdSearch': 'True',
    });
  });

  it('names a whole season without an episode', () => {
    expect(queryVariables({ mode: 'tv', season: 1 })['.Query.Episode']).toBe('S01');
  });

  it('describes a film by its ids, with and without the tt', () => {
    expect(queryVariables({ mode: 'movie', imdbId: 'tt1160419', tmdbId: 438631 })).toMatchObject({
      '.Query.Type': 'movie',
      '.Query.IMDBID': 'tt1160419',
      '.Query.IMDBIDShort': '1160419',
      '.Query.TMDBID': '438631',
      '.Query.IsImdbQuery': 'True',
      '.Query.IsTmdbQuery': 'True',
      '.Query.Keywords': '',
    });
  });

  it('pads a short IMDb id to seven digits', () => {
    expect(queryVariables({ mode: 'movie', imdbId: 'tt12345' })['.Query.IMDBID']).toBe('tt0012345');
  });

  it('describes music and books', () => {
    expect(queryVariables({ mode: 'music', artist: 'Blur', album: 'Parklife' })).toMatchObject({
      '.Query.Type': 'music',
      '.Query.Artist': 'Blur',
      '.Query.Album': 'Parklife',
      '.Query.IsMusicSearch': 'True',
    });
    expect(queryVariables({ mode: 'book', query: 'dune' })['.Query.IsBookSearch']).toBe('True');
  });

  it('calls a search with nothing in it an RSS search', () => {
    expect(queryVariables({})).toMatchObject({
      '.Query.IsRssSearch': 'True',
      '.Query.Keywords': '',
    });
  });

  it('carries the categories asked for as text', () => {
    expect(queryVariables({ categories: [2000, 5040] })['.Query.Categories']).toEqual([
      '2000',
      '5040',
    ]);
  });
});
