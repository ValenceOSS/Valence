import { describe, expect, it } from 'vitest';
import { compareVersions } from './compareVersions';

describe('compareVersions', () => {
  it('orders by major, minor and patch as numbers, not as text', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('2.0.0', '10.0.0')).toBeLessThan(0);
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('1.2.4', '1.2.3')).toBeGreaterThan(0);
  });

  it('puts a release above any prerelease of it', () => {
    expect(compareVersions('1.3.0', '1.3.0-beta.2')).toBeGreaterThan(0);
    expect(compareVersions('1.3.0-beta.2', '1.3.0')).toBeLessThan(0);
    expect(compareVersions('1.3.0-rc.1', '1.2.9')).toBeGreaterThan(0);
  });

  it('orders prereleases part by part, numbers below words', () => {
    expect(compareVersions('1.0.0-beta.10', '1.0.0-beta.2')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    expect(compareVersions('1.0.0-1', '1.0.0-alpha')).toBeLessThan(0);
    expect(compareVersions('1.0.0-alpha.1', '1.0.0-alpha')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0-x-y', '1.0.0-x-y')).toBe(0);
  });
});
