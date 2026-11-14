import { describe, expect, it } from 'vitest';
import type { Viewing } from './Viewing';
import { weightOfHistory } from './weightOfHistory';

const A_FILM = { isSeries: false, stars: null, isFavourite: false };

/**
 * A viewing of a two-hour film.
 *
 * @param seconds - How much of it was watched.
 * @param daysAgo - How long ago.
 * @returns The viewing.
 */
const aViewing = (seconds: number, daysAgo: number): Viewing => ({
  secondsWatched: seconds,
  durationSeconds: 7200,
  isFinished: false,
  daysAgo,
});

describe('weightOfHistory', () => {
  it('counts a film watched to the end today in full', () => {
    expect(weightOfHistory({ ...A_FILM, viewings: [aViewing(7000, 0)] })).toBe(1);
  });

  it('counts a viewing for less the longer ago it was, but never for nothing', () => {
    expect(weightOfHistory({ ...A_FILM, viewings: [aViewing(7000, 120)] })).toBeCloseTo(0.5);
    expect(weightOfHistory({ ...A_FILM, viewings: [aViewing(7000, 3000)] })).toBeCloseTo(0.25);
  });

  it('counts a film given up on early and long ago against it', () => {
    expect(weightOfHistory({ ...A_FILM, viewings: [aViewing(300, 30)] })).toBeLessThan(0);
    expect(weightOfHistory({ ...A_FILM, viewings: [aViewing(300, 2)] })).toBeGreaterThan(0);
  });

  it('counts a programme for more the more of it was watched, up to a ceiling', () => {
    const episodes = (count: number) => ({
      isSeries: true,
      stars: null,
      isFavourite: false,
      viewings: Array.from({ length: count }, () => ({ ...aViewing(0, 0), isFinished: true })),
    });

    expect(weightOfHistory(episodes(10))).toBeGreaterThan(weightOfHistory(episodes(2)));
    expect(weightOfHistory(episodes(1000))).toBe(1.5);
  });

  it('lets stars and keeping it move the weight either way', () => {
    expect(weightOfHistory({ ...A_FILM, viewings: [], stars: 5 })).toBeCloseTo(1.5);
    expect(weightOfHistory({ ...A_FILM, viewings: [], stars: 1 })).toBeCloseTo(-0.9);
    expect(weightOfHistory({ ...A_FILM, viewings: [], isFavourite: true })).toBe(1);
  });
});
