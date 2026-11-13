import { describe, expect, it } from 'vitest';
import { isShortLookup } from './isShortLookup';

describe('isShortLookup', () => {
  it('accepts ordinary names and absent ones', () => {
    expect(isShortLookup('Intimacy', undefined, 'Bloc Party')).toBe(true);
  });

  it('refuses a word longer than any name', () => {
    expect(isShortLookup('Intimacy', 'x'.repeat(201))).toBe(false);
  });
});
