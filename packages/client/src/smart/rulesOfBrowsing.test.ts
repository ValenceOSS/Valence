import { describe, expect, it } from 'vitest';
import { rulesOfBrowsing } from './rulesOfBrowsing';

describe('rulesOfBrowsing', () => {
  it('turns a page’s genres, decades, ratings, stars, library and order into rules', () => {
    expect(
      rulesOfBrowsing({
        kind: 'films',
        libraryIds: ['films'],
        asked: { genres: ['Drama'], decades: [1990, 1980], minRating: 7, minYourStars: 4 },
        arrangement: { order: 'rating', isHidingWatched: true },
      }),
    ).toEqual({
      holds: 'films',
      rules: [
        { kind: 'genre', anyOf: ['Drama'], isNegated: false },
        { kind: 'released', from: 1980, to: 1999 },
        { kind: 'rating', atLeast: 7 },
        { kind: 'yourStars', atLeast: 4 },
        { kind: 'watched', state: 'notFinished' },
        { kind: 'library', anyOf: ['films'] },
      ],
      order: 'rating',
      limit: null,
    });
  });

  it('holds shows from the page of shows, newest first where the page is by size', () => {
    expect(
      rulesOfBrowsing({
        kind: 'shows',
        libraryIds: null,
        asked: {},
        arrangement: { order: 'size', isHidingWatched: false },
      }),
    ).toEqual({ holds: 'series', rules: [], order: 'added', limit: null });
  });

  it('leaves out decades with a gap between them, which one range of years cannot say', () => {
    expect(
      rulesOfBrowsing({
        kind: 'films',
        libraryIds: null,
        asked: { decades: [1980, 2000] },
        arrangement: { order: 'added', isHidingWatched: false },
      }).rules,
    ).toEqual([]);
  });
});
