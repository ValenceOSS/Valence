import { describe, expect, it } from 'vitest';
import { pathParts } from './pathParts';

describe('pathParts', () => {
  it('splits a path into its folder, name and stem', () => {
    expect(pathParts('/movies/Heat (1995)/Heat.mkv')).toEqual({
      folder: '/movies/Heat (1995)',
      fileName: 'Heat.mkv',
      stem: 'Heat',
    });
  });

  it('keeps a name with no extension whole', () => {
    expect(pathParts('/movies/README').stem).toBe('README');
  });
});
