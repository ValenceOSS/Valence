import { describe, expect, it } from 'vitest';
import { pagesToWarm } from './pagesToWarm';

describe('pagesToWarm', () => {
  it('starts with the page somebody is on, then two ahead for every one behind', () => {
    expect(pagesToWarm(10, 100, 7)).toEqual([10, 11, 12, 9, 13, 14, 8]);
  });

  it('keeps to the book at either end of it', () => {
    expect(pagesToWarm(0, 4, 10)).toEqual([0, 1, 2, 3]);
    expect(pagesToWarm(3, 4, 10)).toEqual([3, 2, 1, 0]);
  });

  it('never has more ready than it was allowed', () => {
    expect(pagesToWarm(500, 1000, 40)).toHaveLength(40);
  });

  it('has the whole of a short chapter ready', () => {
    expect(new Set(pagesToWarm(3, 12, 200))).toEqual(
      new Set(Array.from({ length: 12 }, (_, at) => at)),
    );
  });

  it('has nothing to warm in an empty chapter', () => {
    expect(pagesToWarm(0, 0, 10)).toEqual([]);
  });
});
