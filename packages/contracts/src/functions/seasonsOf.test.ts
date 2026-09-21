import { describe, expect, it } from 'vitest';
import { seasonsOf } from './seasonsOf';
import type { Asked } from './seasonsOf';

const EPISODES = [
  { season: 1, episode: 2, title: '', airDate: '2016-04-11' },
  { season: 1, episode: 1, title: '', airDate: '2016-04-04' },
  { season: 0, episode: 1, title: '', airDate: null },
  { season: 2, episode: 1, title: '', airDate: null },
];

/**
 * A request holding the episodes named.
 */
const asking = (...items: Asked[]) => [{ items }];

describe('seasonsOf', () => {
  it('counts each season’s episodes, and the day its first aired, specials first', () => {
    expect(seasonsOf(EPISODES)).toEqual([
      { season: 0, episodeCount: 1, firstAired: null, standing: 'askable' },
      { season: 1, episodeCount: 2, firstAired: '2016-04-04', standing: 'askable' },
      { season: 2, episodeCount: 1, firstAired: null, standing: 'askable' },
    ]);
  });

  it('says a season nobody has asked for is one to ask for', () => {
    expect(seasonsOf(EPISODES, asking({ season: 3, state: 'filed' }))[1]?.standing).toBe('askable');
  });

  it('says a season asked for and still on its way has been asked for', () => {
    expect(
      seasonsOf(
        EPISODES,
        asking({ season: 1, state: 'wanted' }, { season: 1, state: 'searching' }),
      )[1]?.standing,
    ).toBe('requested');
  });

  it('says a season only part of which arrived is partly here', () => {
    expect(
      seasonsOf(
        EPISODES,
        asking({ season: 1, state: 'filed' }, { season: 1, state: 'downloading' }),
      )[1]?.standing,
    ).toBe('partly');
  });

  it('says a season every episode of which arrived is here', () => {
    expect(
      seasonsOf(
        EPISODES,
        asking({ season: 1, state: 'filed' }, { season: 1, state: 'available' }),
      )[1]?.standing,
    ).toBe('library');
  });

  it('says a season the library already holds is here, whoever fetched it', () => {
    expect(seasonsOf(EPISODES, [], new Map([[1, 2]]))[1]?.standing).toBe('library');
    expect(seasonsOf(EPISODES, [], new Map([[1, 1]]))[1]?.standing).toBe('partly');
  });

  it('counts an episode once where the library holds what was also filed for it', () => {
    expect(
      seasonsOf(EPISODES, asking({ season: 1, state: 'filed' }), new Map([[1, 1]]))[1]?.standing,
    ).toBe('partly');
  });

  it('counts what was asked across every request for the series', () => {
    expect(
      seasonsOf(EPISODES, [
        { items: [{ season: 1, state: 'filed' }] },
        { items: [{ season: 1, state: 'available' }] },
      ])[1]?.standing,
    ).toBe('library');
  });
});
