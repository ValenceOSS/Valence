import { describe, expect, it } from 'vitest';
import { loudnessOfRow } from './loudnessOfRow';

describe('loudnessOfRow', () => {
  it('hands on a measured track’s loudness', () => {
    expect(
      loudnessOfRow({ trackGainDb: -6, trackPeak: 0.9, albumGainDb: -5, albumPeak: 1 }),
    ).toEqual({ trackGainDb: -6, trackPeak: 0.9, albumGainDb: -5, albumPeak: 1 });
  });

  it('says nothing for a track not yet measured', () => {
    expect(
      loudnessOfRow({ trackGainDb: null, trackPeak: null, albumGainDb: -5, albumPeak: 1 }),
    ).toBeNull();
  });

  it('drops an album peak that has no album gain to go with it', () => {
    expect(
      loudnessOfRow({ trackGainDb: -6, trackPeak: null, albumGainDb: null, albumPeak: 1 }),
    ).toEqual({ trackGainDb: -6, trackPeak: null, albumGainDb: null, albumPeak: null });
  });
});
