import { describe, expect, it } from 'vitest';
import { idTagOf } from './idTagOf';

describe('idTagOf', () => {
  it('finds the catalogue number a folder carries, in either way media servers write it', () => {
    expect(idTagOf('A Film (2001) [tmdbid-603]')).toBe('[tmdbid-603]');
    expect(idTagOf('A Show {tvdb-81189}')).toBe('{tvdb-81189}');
    expect(idTagOf('A Film (2001) [IMDBID-tt0133093]')).toBe('[IMDBID-tt0133093]');
    expect(idTagOf('A Film (2001)')).toBeNull();
  });
});
