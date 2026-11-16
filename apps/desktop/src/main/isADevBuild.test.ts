import { describe, expect, it } from 'vitest';
import { isADevBuild } from './isADevBuild';

describe('isADevBuild', () => {
  it('counts Valence run from source', () => {
    expect(isADevBuild(false, '1.7.0')).toBe(true);
  });

  it('counts a test build of a branch and the dev channel', () => {
    expect(isADevBuild(true, '0.0.0-dev')).toBe(true);
    expect(isADevBuild(true, '1.8.0-dev.12')).toBe(true);
  });

  it('does not count a release', () => {
    expect(isADevBuild(true, '1.7.0')).toBe(false);
  });
});
