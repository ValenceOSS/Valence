import { describe, expect, it } from 'vitest';
import { ARR_MASK, isMasked } from './isMasked';

describe('isMasked', () => {
  it('knows the mask from a real secret', () => {
    expect(isMasked(ARR_MASK)).toBe(true);
    expect(isMasked('hunter2')).toBe(false);
    expect(isMasked('')).toBe(false);
  });
});
