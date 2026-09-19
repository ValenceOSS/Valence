import { describe, expect, it } from 'vitest';
import { seasonsOf } from './seasonsOf';

describe('seasonsOf', () => {
  it('counts each season’s episodes, and the day its first aired, specials first', () => {
    expect(
      seasonsOf([
        { season: 1, episode: 2, title: '', airDate: '2016-04-11' },
        { season: 1, episode: 1, title: '', airDate: '2016-04-04' },
        { season: 0, episode: 1, title: '', airDate: null },
        { season: 2, episode: 1, title: '', airDate: null },
      ]),
    ).toEqual([
      { season: 0, episodeCount: 1, firstAired: null },
      { season: 1, episodeCount: 2, firstAired: '2016-04-04' },
      { season: 2, episodeCount: 1, firstAired: null },
    ]);
  });
});
