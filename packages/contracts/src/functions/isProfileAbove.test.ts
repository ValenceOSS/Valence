import { describe, expect, it } from 'vitest';
import { isProfileAbove } from './isProfileAbove';

describe('isProfileAbove', () => {
  it('puts a profile placed nearer the top above one placed lower', () => {
    expect(isProfileAbove({ position: 0 }, { position: 2 })).toBe(true);
    expect(isProfileAbove({ position: 2 }, { position: 0 })).toBe(false);
    expect(isProfileAbove({ position: 1 }, { position: 1 })).toBe(false);
  });
});
