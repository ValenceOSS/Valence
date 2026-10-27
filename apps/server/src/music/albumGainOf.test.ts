import { describe, expect, it } from 'vitest';
import { albumGainOf } from './albumGainOf';

describe('albumGainOf', () => {
  it('gives an album of equally loud songs the same gain as each song', () => {
    expect(
      albumGainOf([
        { durationSeconds: 200, trackGainDb: -6, trackPeak: 0.9 },
        { durationSeconds: 100, trackGainDb: -6, trackPeak: 0.95 },
      ])?.gainDb,
    ).toBeCloseTo(-6, 6);
  });

  it('lets a short quiet song move the album less than a long loud one', () => {
    const gainDb =
      albumGainOf([
        { durationSeconds: 300, trackGainDb: -8, trackPeak: null },
        { durationSeconds: 30, trackGainDb: 4, trackPeak: null },
      ])?.gainDb ?? 0;

    expect(gainDb).toBeLessThan(-7);
    expect(gainDb).toBeGreaterThan(-8);
  });

  it('takes the loudest song’s peak as the album’s', () => {
    expect(
      albumGainOf([
        { durationSeconds: 200, trackGainDb: -6, trackPeak: 0.9 },
        { durationSeconds: 100, trackGainDb: -2, trackPeak: 1.1 },
        { durationSeconds: 100, trackGainDb: -4, trackPeak: null },
      ])?.peak,
    ).toBe(1.1);
  });

  it('has no peak where no song’s peak is known', () => {
    expect(
      albumGainOf([{ durationSeconds: 200, trackGainDb: -6, trackPeak: null }])?.peak,
    ).toBeNull();
  });

  it('says nothing for an album with nothing to weigh', () => {
    expect(albumGainOf([])).toBeNull();
    expect(albumGainOf([{ durationSeconds: 0, trackGainDb: -6, trackPeak: 1 }])).toBeNull();
  });
});
