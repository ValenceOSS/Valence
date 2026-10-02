import { describe, expect, it } from 'vitest';
import { isVersionAtLeast } from './isVersionAtLeast';

describe('isVersionAtLeast', () => {
  it('compares the major and minor version', () => {
    expect(isVersionAtLeast('10.9.11', 10, 9)).toBe(true);
    expect(isVersionAtLeast('10.8.13', 10, 9)).toBe(false);
    expect(isVersionAtLeast('12.1.0', 10, 10)).toBe(true);
    expect(isVersionAtLeast('4.8.10.0', 10, 9)).toBe(false);
  });

  it('reads a version it cannot read as nought', () => {
    expect(isVersionAtLeast('beta', 0, 0)).toBe(true);
    expect(isVersionAtLeast('', 1, 0)).toBe(false);
  });
});
