import { describe, expect, it } from 'vitest';
import {
  AppearanceSchema,
  ROUNDNESS_LABELS,
  ROUNDNESS_LEVELS,
  ROUNDNESS_SCALES,
  RoundnessSchema,
} from './Roundness';

describe('Roundness', () => {
  it('names every level, and scales and labels each one', () => {
    for (const level of ROUNDNESS_LEVELS) {
      expect(ROUNDNESS_SCALES[level]).toBeGreaterThanOrEqual(0);
      expect(ROUNDNESS_LABELS[level]).not.toBe('');
    }
  });

  it('makes the default level the scale of nothing changed', () => {
    expect(ROUNDNESS_SCALES.default).toBe(1);
  });

  it('orders the levels from sharpest to roundest', () => {
    const scales = ROUNDNESS_LEVELS.map((level) => ROUNDNESS_SCALES[level]);

    expect(scales).toEqual([...scales].sort((first, second) => first - second));
  });

  it('refuses a level it does not know', () => {
    expect(RoundnessSchema.safeParse('square').success).toBe(false);
  });

  it('opens with the default level where the server says nothing', () => {
    expect(AppearanceSchema.parse({})).toEqual({ roundness: 'default' });
  });
});
