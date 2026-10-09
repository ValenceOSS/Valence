import { describe, expect, it } from 'vitest';
import { planSearches } from './planSearches';

const IDS = { tmdbId: 95396, tvdbId: 371980, imdbId: 'tt11280740' };

const SEVERANCE = {
  kind: 'series' as const,
  title: 'Severance',
  artistName: null,
  ...IDS,
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
  it('asks for a film by its title and catalogue ids', () => {
    const film = { id: 'film', season: null, episode: null, airDate: null, title: 'Dune' };

    expect(
      planSearches(
        {
          kind: 'film',
          title: 'Dune',
          tmdbId: 438631,
          tvdbId: null,
          imdbId: 'tt1160419',
          artistName: null,
        },
        [film],
        [film],
        '2026-09-19',
      ),
    ).toEqual([
      {
        search: { query: 'Dune', mode: 'movie', tmdbId: 438631, imdbId: 'tt1160419' },
        itemIds: ['film'],
      },
    ]);
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
        {
          kind: 'artist',
          title: 'Pink Floyd',
          tmdbId: null,
          tvdbId: null,
          imdbId: null,
          artistName: 'Pink Floyd',
        },
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
      { search: { query: 'Severance', mode: 'tv', season: 1, ...IDS }, itemIds: ['1x1', '1x2'] },
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
      { query: 'Severance', mode: 'tv', ...IDS },
      { query: 'Severance', mode: 'tv', season: 1, episode: 2, ...IDS },
      { query: 'Severance', mode: 'tv', season: 2, episode: 1, ...IDS },
      { query: 'Severance', mode: 'tv', season: 2, episode: 2, ...IDS },
    ]);
  });

  it('asks for the whole run first where what is wanted spans more than one season', () => {
    const first = anEpisode(1, 1);
    const second = anEpisode(2, 1, '2025-01-17');
    const planned = planSearches(SEVERANCE, [first, second], [first, second], '2026-09-19');

    expect(planned[0]?.search).toEqual({ query: 'Severance', mode: 'tv', ...IDS });
    expect(planned[0]?.itemIds).toEqual([first.id, second.id]);
  });

  it('asks for no whole run where only one season is wanted', () => {
    const first = anEpisode(1, 1);
    const second = anEpisode(1, 2);

    expect(
      planSearches(SEVERANCE, [first, second], [first, second], '2026-09-19').map(
        (planned) => planned.search,
      ),
    ).toEqual([{ query: 'Severance', mode: 'tv', season: 1, ...IDS }]);
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
