import { describe, expect, it } from 'vitest';
import { levelledVolume } from './levelledVolume';

const LOUD = { trackGainDb: -6, trackPeak: 1, albumGainDb: -3, albumPeak: 1 };

describe('levelledVolume', () => {
  it('plays at the volume chosen where levelling is off', () => {
    expect(levelledVolume(0.8, { loudness: LOUD }, 'off')).toBe(0.8);
  });

  it('plays at the volume chosen where the song has not been measured', () => {
    expect(levelledVolume(0.8, { loudness: null }, 'track')).toBe(0.8);
    expect(levelledVolume(0.8, null, 'album')).toBe(0.8);
  });

  it('turns a loud song down by its own gain', () => {
    expect(levelledVolume(1, { loudness: LOUD }, 'track')).toBeCloseTo(0.501, 3);
  });

  it('turns a song down by its album gain where whole albums are levelled', () => {
    expect(levelledVolume(1, { loudness: LOUD }, 'album')).toBeCloseTo(0.708, 3);
  });

  it('falls back to the song gain where the album has none', () => {
    expect(
      levelledVolume(1, { loudness: { ...LOUD, albumGainDb: null, albumPeak: null } }, 'album'),
    ).toBeCloseTo(0.501, 3);
  });

  it('never turns a quiet song up past the volume chosen', () => {
    expect(levelledVolume(0.5, { loudness: { ...LOUD, trackGainDb: 6 } }, 'track')).toBe(0.5);
  });

  it('keeps the loudest moment from clipping', () => {
    expect(
      levelledVolume(1, { loudness: { ...LOUD, trackGainDb: -1, trackPeak: 1.25 } }, 'track'),
    ).toBeCloseTo(0.8, 3);
  });
});
