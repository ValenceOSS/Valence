import { describe, expect, it } from 'vitest';
import { isWithin } from './isWithin';

describe('isWithin', () => {
  it('finds a folder in itself and in the folders above it', () => {
    expect(isWithin('/movies/', '/movies')).toBe(true);
    expect(isWithin('/movies/Dune (2021)', '/movies/')).toBe(true);
    expect(isWithin('/anything', '/')).toBe(true);
    expect(isWithin('C:\\Movies\\Dune', 'C:/Movies')).toBe(true);
  });

  it('does not take a folder that only starts the same for one that holds it', () => {
    expect(isWithin('/movies4k/Dune', '/movies')).toBe(false);
    expect(isWithin('/movies', '/movies/Dune')).toBe(false);
  });
});
