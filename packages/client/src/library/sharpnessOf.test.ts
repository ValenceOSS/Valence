import { describe, expect, it } from 'vitest';
import { sharpnessOf } from './sharpnessOf';

describe('sharpnessOf', () => {
  it('names a picture by the sharpest step it reaches', () => {
    expect(sharpnessOf({ width: 3840, height: 2160 })).toBe('4K');
    expect(sharpnessOf({ width: 1920, height: 800 })).toBe('HD');
    expect(sharpnessOf({ width: 720, height: 480 })).toBe('SD');
  });
});
