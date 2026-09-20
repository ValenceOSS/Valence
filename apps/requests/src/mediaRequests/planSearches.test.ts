import { describe, expect, it } from 'vitest';
import { planSearches } from './planSearches';

const SEVERANCE = {
  kind: 'series' as const,
  title: 'Severance',
  tmdbId: 95396,
  artistName: null,
};

/**
 * An episode that aired on the day given.
 */
const anEpisode = (season: number, episode: number, airDate: string | null = '2022-02-18') => ({
  id: `${season.toString()}x${episode.toString()}`,
  season,
  episode,
  airDate,
  title: '',
});

describe('planSearches', () => {
  it('asks for a film by its title and catalogue id', () => {
    const film = { id: 'film', season: null, episode: null, airDate: null, title: 'Dune' };

    expect(
      planSearches(
        { kind: 'film', title: 'Dune', tmdbId: 438631, artistName: null },
        [film],
        [film],
        '2026-09-19',
      ),
    ).toEqual([{ search: { query: 'Dune', mode: 'movie', tmdbId: 438631 }, itemIds: ['film'] }]);
  });

  it('asks for each album among music, by its artist and title', () => {
    const album = (id: string, title: string) => ({
      id,
      season: null,
      episode: null,
      airDate: '1973-03-01',
      title,
    });
    const albums = [album('moon', 'The Dark Side of the Moon'), album('wall', 'The Wall')];

    expect(
      planSearches(
        { kind: 'artist', title: 'Pink Floyd', tmdbId: null, artistName: 'Pink Floyd' },
        albums,
        albums,
        '2026-09-19',
      ),
    ).toEqual([
      {
        search: {
          query: 'Pink Floyd The Dark Side of the Moon',
          mode: 'music',
          artist: 'Pink Floyd',
          album: 'The Dark Side of the Moon',
        },
        itemIds: ['moon'],
      },
      {
        search: {
          query: 'Pink Floyd The Wall',
          mode: 'music',
          artist: 'Pink Floyd',
          album: 'The Wall',
        },
        itemIds: ['wall'],
      },
    ]);
  });

  it('asks for a season that has aired as a whole', () => {
    const items = [anEpisode(1, 1), anEpisode(1, 2)];

    expect(planSearches(SEVERANCE, items, items, '2026-09-19')).toEqual([
      { search: { query: 'Severance', mode: 'tv', season: 1 }, itemIds: ['1x1', '1x2'] },
    ]);
  });

  it('asks for each episode of a season still airing, or the one episode wanted', () => {
    const second = anEpisode(1, 2);
    const premiere = anEpisode(2, 1, '2025-01-17');
    const next = anEpisode(2, 2, '2025-01-24');
    const items = [anEpisode(1, 1), second, premiere, next, anEpisode(2, 3, '2026-12-01')];

    expect(
      planSearches(SEVERANCE, items, [second, premiere, next], '2026-09-19').map(
        (planned) => planned.search,
      ),
    ).toEqual([
      { query: 'Severance', mode: 'tv', season: 1, episode: 2 },
      { query: 'Severance', mode: 'tv', season: 2, episode: 1 },
      { query: 'Severance', mode: 'tv', season: 2, episode: 2 },
    ]);
  });

  it('searches by a title that no indexer reads as leaving words out', () => {
    const request = { ...SEVERANCE, title: 'Re:ZERO -Starting Life in Another World-' };
    const episode = anEpisode(1, 1);

    expect(planSearches(request, [episode], [episode], '2026-09-19')[0]?.search.query).toBe(
      'Re:ZERO Starting Life in Another World',
    );
  });

  it('asks nothing where nothing is wanted', () => {
    expect(planSearches(SEVERANCE, [anEpisode(1, 1)], [], '2026-09-19')).toEqual([]);
  });
});
