import { describe, expect, it } from 'vitest';
import { narrowAsTheServerDoes } from '@ValenceClient/library/narrowAsTheServerDoes';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

const DRAMA = aMediaSummary({ id: 'drama', genres: ['Drama'], year: 1994, rating: 8.1 });

const COMEDY = aMediaSummary({ id: 'comedy', genres: ['Comedy'], year: 2016, rating: 6.2 });

const UNKNOWN = aMediaSummary({ id: 'unknown', genres: null, year: null, rating: null });

const EVERY = [DRAMA, COMEDY, UNKNOWN];

/**
 * Names what survives.
 *
 * @param narrowed - What is asked.
 * @returns The ids kept.
 */
const kept = (narrowed: Parameters<typeof narrowAsTheServerDoes>[1]) =>
  narrowAsTheServerDoes(EVERY, narrowed).map((item) => item.id);

describe('narrowAsTheServerDoes', () => {
  it('hands back the same list where nothing is asked', () => {
    expect(narrowAsTheServerDoes(EVERY, {})).toBe(EVERY);
  });

  it('keeps what has any of the genres asked for', () => {
    expect(kept({ genres: ['Drama', 'Horror'] })).toEqual(['drama']);
  });

  it('keeps what came out in any of the decades asked for', () => {
    expect(kept({ decades: [1990, 2010] })).toEqual(['drama', 'comedy']);
    expect(kept({ decades: [2000] })).toEqual([]);
  });

  it('keeps what is rated at least as well as asked, and never what nobody rated', () => {
    expect(kept({ minRating: 6.2 })).toEqual(['drama', 'comedy']);
    expect(kept({ minRating: 8.5 })).toEqual([]);
  });

  it('keeps only what survives every filter asked for', () => {
    expect(kept({ genres: ['Comedy', 'Drama'], decades: [2010], minRating: 6 })).toEqual([
      'comedy',
    ]);
  });
});
