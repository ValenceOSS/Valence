import { describe, expect, it } from 'vitest';
import { compareReleases } from './compareReleases';

describe('compareReleases', () => {
  it('finds the newer release whichever number differs', () => {
    expect(compareReleases('1.6.0', 'v1.7.0')).toBeLessThan(0);
    expect(compareReleases('v2.0.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareReleases('1.6.10', '1.6.9')).toBeGreaterThan(0);
  });

  it('reads a development build as the release it was made from', () => {
    expect(compareReleases('1.6.0-12-gabc', 'v1.6.0')).toBe(0);
  });

  it('gives up on something that is not a release number', () => {
    expect(compareReleases('0.0.0-dev', 'nightly')).toBe(0);
  });
});
