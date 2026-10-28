import { describe, expect, it } from 'vitest';
import { createThreadedAudioMatcher } from './createThreadedAudioMatcher';
import { matchSeason } from './matchSeason';
import type { SeasonToMatch } from './matchSeason';

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

/**
 * A season whose episodes end on the same music, or share nothing at all.
 *
 * @param episodes - How many.
 * @param isShared - Whether they share an ending.
 * @returns The season, every episode wanted.
 */
const aSeason = (episodes: number, isShared: boolean): SeasonToMatch => {
  const theme = distinct(1, Math.round(60 * FPS));
  const prints = Array.from({ length: episodes }, (_, index) => ({
    mediaId: `e${index.toString()}`,
    framesPerSecond: FPS,
    hashes: isShared
      ? [...distinct(100 + index, 2000 + index * 40), ...theme, ...distinct(200 + index, 1500)]
      : distinct(300 + index, 7000),
  }));

  return {
    prints,
    wanted: prints.map((print) => print.mediaId),
    minSeconds: 15,
    enough: 3,
    most: 10,
  };
};

describe('createThreadedAudioMatcher', () => {
  it('answers as matching on this thread would', async () => {
    const season = aSeason(8, true);

    expect(await createThreadedAudioMatcher().matchSeason(season)).toEqual(matchSeason(season));
  });

  it('keeps this thread answering while it matches a long season', async () => {
    const matcher = createThreadedAudioMatcher();

    await matcher.matchSeason(aSeason(3, true));

    let beats = 0;
    let isWaiting = true;
    const beat = () => {
      beats += 1;

      if (isWaiting) {
        setImmediate(beat);
      }
    };

    setImmediate(beat);
    await matcher.matchSeason(aSeason(40, false));
    isWaiting = false;

    expect(beats).toBeGreaterThan(10);
  });

  it('says it could not match what it could not read, rather than never answering', async () => {
    const season = { ...aSeason(3, true), enough: Number.NaN };

    await expect(createThreadedAudioMatcher().matchSeason(season)).rejects.toThrow();
  });
});
