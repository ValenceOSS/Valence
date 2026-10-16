import { describe, expect, it } from 'vitest';
import { anAnimeShow } from '@ValenceRequests/testing/anAnimeShow';
import { planAnimeSearches } from './planAnimeSearches';

const { anime, items } = anAnimeShow();

const REQUEST = { title: 'Show', aliases: [], tmdbId: 7, tvdbId: null, imdbId: null };

describe('planAnimeSearches', () => {
  it('asks for a finished cour as a batch first, by its name, then its episodes', () => {
    const courTwo = items.filter((item) => item.cour === 2);
    const [batch] = planAnimeSearches(REQUEST, anime, items, courTwo, '2026-01-01');

    expect(batch).toMatchObject({
      search: { query: 'Show Second Arc', mode: 'search' },
      itemIds: courTwo.map((item) => item.id),
      queries: ['Show Second Arc', 'Shou S2'],
    });
    expect(batch?.fallback?.[0]).toMatchObject({
      search: { mode: 'search' },
      itemIds: [courTwo[0]?.id],
      queries: ['Show Second Arc 01', 'Shou 13', 'Show Second Arc 1'],
    });
    expect(batch?.fallback?.[1]).toMatchObject({
      search: { mode: 'tv', season: 1, episode: 13, tmdbId: 7 },
      queries: ['Shou', 'Show'],
    });
  });

  it("asks for a cour that's the catalogue's season by that season too, once its batch is not found", () => {
    const courThree = items.filter((item) => item.cour === 3);
    const [batch] = planAnimeSearches(REQUEST, anime, items, courThree, '2026-01-01');

    expect(batch?.fallback?.[0]).toMatchObject({
      search: { mode: 'tv', season: 2, tmdbId: 7 },
      itemIds: courThree.map((item) => item.id),
    });
  });

  it('asks for an episode of a cour still airing on its own, in both numberings', () => {
    const [first] = items;
    const plans = planAnimeSearches(
      REQUEST,
      anime,
      items,
      first === undefined ? [] : [first],
      '2020-02-01',
    );

    expect(plans.map((plan) => plan.queries)).toEqual([
      ['Shou 01', 'Shou 1'],
      ['Shou', 'Show'],
    ]);
    expect(plans[1]?.search).toMatchObject({ mode: 'tv', season: 1, episode: 1 });
  });
});
