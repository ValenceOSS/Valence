import { describe, expect, it } from 'vitest';
import { isOrdinaryPath } from './isOrdinaryPath';

describe('isOrdinaryPath', () => {
  it('judges a file from the library down, so a library under a hidden folder is still read', () => {
    expect(isOrdinaryPath('/mnt/.media/movies/Heat.mkv', '/mnt/.media/movies')).toBe(true);
  });

  it('leaves out a hidden file inside the library', () => {
    expect(isOrdinaryPath('/movies/._Heat.mkv', '/movies')).toBe(false);
  });
});
