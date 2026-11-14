import { describe, expect, it } from 'vitest';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { showDetailOfJellyfin } from './showDetailOfJellyfin';
import { aFakeStore } from './testing/aFakeStore';
import { aJellyfinEpisode } from './testing/aJellyfinEpisode';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('showDetailOfJellyfin', () => {
  it('gathers the episodes into their seasons, in order', () => {
    const show = showDetailOfJellyfin(
      aJellyfinFilm({ Type: 'Series', Name: 'Twin Peaks' }),
      [
        aJellyfinEpisode({ Id: '22222222222222222222222222222222', ParentIndexNumber: 2 }),
        aJellyfinEpisode(),
      ],
      '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      { address: 'http://j.test', book: createJellyfinIdBook(aFakeStore()) },
    );

    expect(show.seasons.map((season) => [season.seasonNumber, season.episodes.length])).toEqual([
      [1, 1],
      [2, 1],
    ]);
    expect(show).toMatchObject({ seasonCount: 2, episodeCount: 2 });
  });
});
