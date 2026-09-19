import { describe, expect, it } from 'vitest';
import { planSearches } from './planSearches';

const SEVERANCE = { kind: 'series' as const, title: 'Severance', tmdbId: 95396 };

/**
 * An episode that aired on the day given.
 */
const anEpisode = (season: number, episode: number, airDate: string | null = '2022-02-18') => ({
  id: `${season.toString()}x${episode.toString()}`,
  season,
  episode,
  airDate,
});

describe('planSearches', () => {
  it('asks for a film by its title and catalogue id', () => {
    const film = { id: 'film', season: null, episode: null, airDate: null };

    expect(
      planSearches({ kind: 'film', title: 'Dune', tmdbId: 438631 }, [film], [film], '2026-09-19'),
    ).toEqual([{ search: { query: 'Dune', mode: 'movie', tmdbId: 438631 }, itemIds: ['film'] }]);
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

  it('asks nothing where nothing is wanted', () => {
    expect(planSearches(SEVERANCE, [anEpisode(1, 1)], [], '2026-09-19')).toEqual([]);
  });
});
