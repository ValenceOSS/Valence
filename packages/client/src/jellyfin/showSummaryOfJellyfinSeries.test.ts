import { describe, expect, it } from 'vitest';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { showSummaryOfJellyfinSeries } from './showSummaryOfJellyfinSeries';
import { aFakeStore } from './testing/aFakeStore';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('showSummaryOfJellyfinSeries', () => {
  it('lets the programme stand for itself, so its pictures are found under its own identifier', () => {
    const summary = showSummaryOfJellyfinSeries(
      aJellyfinFilm({ Type: 'Series', Name: 'Twin Peaks', ChildCount: 2, RecursiveItemCount: 30 }),
      '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      { address: 'http://j.test', book: createJellyfinIdBook(aFakeStore()) },
    );

    expect(summary).toMatchObject({ title: 'Twin Peaks', seasonCount: 2, episodeCount: 30 });
    expect(summary.coverMediaId).toBe(summary.id);
    expect(summary.artwork?.poster).toContain('/Images/Primary?');
  });
});
