import { describe, expect, it } from 'vitest';
import { describeSeasons } from './describeSeasons';

describe('describeSeasons', () => {
  it('names one season', () => {
    expect(describeSeasons([3])).toBe('Season 3');
  });

  it('names two seasons apart as a pair, and two together the same way', () => {
    expect(describeSeasons([1, 3])).toBe('Seasons 1 and 3');
    expect(describeSeasons([1, 2])).toBe('Seasons 1 and 2');
  });

  it('writes a run of three or more as a range', () => {
    expect(describeSeasons([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe('Seasons 1–9');
  });

  it('leaves a gap as a gap', () => {
    expect(describeSeasons([1, 2, 3, 4, 6, 7])).toBe('Seasons 1–4, 6 and 7');
  });

  it('names the specials rather than calling them season zero', () => {
    expect(describeSeasons([0])).toBe('Specials');
    expect(describeSeasons([0, 2])).toBe('Specials and season 2');
    expect(describeSeasons([0, 1, 2, 3])).toBe('Specials and seasons 1–3');
  });

  it('reads seasons given in any order, and each once', () => {
    expect(describeSeasons([3, 1, 2, 2])).toBe('Seasons 1–3');
  });

  it('names nothing where no seasons were named', () => {
    expect(describeSeasons([])).toBeNull();
  });
});
