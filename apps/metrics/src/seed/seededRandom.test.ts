import { describe, expect, it } from 'vitest';
import { seededRandom } from './seededRandom';

describe('seededRandom', () => {
  it('gives the same numbers for the same seed, each from 0 up to 1', () => {
    const first = seededRandom(412);
    const second = seededRandom(412);
    const drawn = Array.from({ length: 50 }, () => first());

    expect(Array.from({ length: 50 }, () => second())).toStrictEqual(drawn);
    expect(drawn.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(drawn).size).toBe(50);
  });

  it('gives different numbers for a different seed', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });
});
