import { describe, expect, it } from 'vitest';
import { BYTES_IN_A_GIGABYTE, isLargerThan } from './isLargerThan';

describe('isLargerThan', () => {
  it('matches a file above the line', () => {
    expect(isLargerThan(70 * BYTES_IN_A_GIGABYTE, 20)).toBe(true);
  });

  it('does not match one below it', () => {
    expect(isLargerThan(4 * BYTES_IN_A_GIGABYTE, 20)).toBe(false);
  });

  it('matches one exactly on it', () => {
    expect(isLargerThan(20 * BYTES_IN_A_GIGABYTE, 20)).toBe(true);
  });

  it('matches everything where no threshold was set', () => {
    expect(isLargerThan(1, null)).toBe(true);
    expect(isLargerThan(null, null)).toBe(true);
  });

  it('does not match a file whose size nobody recorded, once a threshold is set', () => {
    expect(isLargerThan(null, 20)).toBe(false);
  });
});
