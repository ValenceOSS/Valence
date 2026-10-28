import { describe, expect, it } from 'vitest';
import { matchSeason } from './matchSeason';

const FPS = 15.625;

/**
 * Hashes decorrelated enough that no two stretches match by accident.
 *
 * @param seed - Which hashes.
 * @param count - How many.
 * @returns The hashes.
 */
const distinct = (seed: number, count: number): number[] => {
  let state = (seed * 0x9e3779b9) >>> 0;

  return Array.from({ length: count }, () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1) >>> 0;
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return (value ^ (value >>> 14)) >>> 0;
  });
};

const theme = distinct(1, Math.round(60 * FPS));

const episode = (mediaId: string, lead: number, isShared = true) => ({
  mediaId,
  framesPerSecond: FPS,
  hashes: isShared
    ? [...distinct(lead + 100, Math.round(lead * FPS)), ...theme, ...distinct(lead + 200, 900)]
    : distinct(lead + 300, 3000),
});

describe('matchSeason', () => {
  it('finds where each wanted episode shares the theme, in its own time', () => {
    const matched = matchSeason({
      prints: [episode('a', 10), episode('b', 20), episode('c', 30), episode('d', 40)],
      wanted: ['d'],
      minSeconds: 15,
      enough: 3,
      most: 10,
    });

    expect(matched.get('d')).toHaveLength(3);
    expect(matched.get('d')?.[0]?.startSeconds).toBeCloseTo(40, 0);
  });

  it('holds an episode against more of the season where the first are the odd ones out', () => {
    const matched = matchSeason({
      prints: [
        episode('odd1', 5, false),
        episode('odd2', 6, false),
        episode('a', 10),
        episode('b', 20),
        episode('c', 30),
      ],
      wanted: ['c'],
      minSeconds: 15,
      enough: 3,
      most: 10,
    });

    expect(matched.get('c')).toHaveLength(2);
  });

  it('leaves out an episode it has no fingerprint for', () => {
    const matched = matchSeason({
      prints: [episode('a', 10), episode('b', 20)],
      wanted: ['gone'],
      minSeconds: 15,
      enough: 3,
      most: 10,
    });

    expect(matched.has('gone')).toBe(false);
  });
});
