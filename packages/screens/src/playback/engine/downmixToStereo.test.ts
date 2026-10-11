import { describe, expect, it } from 'vitest';
import { downmixToStereo } from '@ValenceScreens/playback/engine/downmixToStereo';

/**
 * A plane holding one sample.
 *
 * @param value - The sample.
 * @returns The plane.
 */
const aPlane = (value: number): Float32Array => Float32Array.from([value]);

describe('downmixToStereo', () => {
  it('keeps the dialogue: a 7.1 centre reaches both sides at half power', () => {
    const silent = aPlane(0);
    const [left, right] = downmixToStereo([
      silent,
      silent,
      aPlane(0.5),
      silent,
      silent,
      silent,
      silent,
      silent,
    ]);

    expect(left[0]).toBeCloseTo(0.5 * Math.SQRT1_2);
    expect(right[0]).toBeCloseTo(0.5 * Math.SQRT1_2);
  });

  it('sends each 5.1 surround to its own side and leaves the LFE out', () => {
    const silent = aPlane(0);
    const [left, right] = downmixToStereo([
      silent,
      silent,
      silent,
      aPlane(0.8),
      aPlane(0.4),
      silent,
    ]);

    expect(left[0]).toBeCloseTo(0.4 * Math.SQRT1_2);
    expect(right[0]).toBe(0);
  });

  it('rounds off rather than clipping where many loud channels meet', () => {
    const loud = aPlane(1);
    const [left] = downmixToStereo([loud, loud, loud, loud, loud, loud]);

    expect(left[0]).toBeLessThanOrEqual(1);
    expect(left[0]).toBeGreaterThan(0.9);
  });

  it('keeps stereo as it was', () => {
    const [left, right] = downmixToStereo([aPlane(0.25), aPlane(-0.25)]);

    expect([left[0], right[0]]).toEqual([0.25, -0.25]);
  });
});
