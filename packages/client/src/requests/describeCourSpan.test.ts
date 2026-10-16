import { describe, expect, it } from 'vitest';
import { describeCourSpan } from './describeCourSpan';

describe('describeCourSpan', () => {
  it('says the season and episodes a cour covers, and its numbers from the first', () => {
    expect(
      describeCourSpan({
        seasons: [1],
        first: { season: 1, episode: 13 },
        last: { season: 1, episode: 24 },
        firstAbsolute: 13,
        lastAbsolute: 24,
      }),
    ).toBe('S1 · E13–E24 · #13–24');
  });

  it('says a span across seasons', () => {
    expect(
      describeCourSpan({
        seasons: [1, 2],
        first: { season: 1, episode: 23 },
        last: { season: 2, episode: 10 },
        firstAbsolute: null,
        lastAbsolute: null,
      }),
    ).toBe('S1 E23 – S2 E10');
  });
});
