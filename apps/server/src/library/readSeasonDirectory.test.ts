import { describe, expect, it } from 'vitest';
import { readSeasonDirectory } from './readSeasonDirectory';

describe('readSeasonDirectory', () => {
  it('reads a season written out', () => {
    expect(readSeasonDirectory('Season 2')).toBe(2);
  });

  it('reads a season written short', () => {
    expect(readSeasonDirectory('S03')).toBe(3);
  });

  it('treats specials as season zero, which is where they belong', () => {
    expect(readSeasonDirectory('Specials')).toBe(0);
  });

  it('reports nothing for a directory that is not a season', () => {
    expect(readSeasonDirectory('Some Show')).toBeNull();
  });

  it('reads a season past the ninety-ninth', () => {
    expect(readSeasonDirectory('Season 104')).toBe(104);
  });

  it('reads the words the tools filling a shelf write in other languages', () => {
    expect(readSeasonDirectory('Staffel 2')).toBe(2);
    expect(readSeasonDirectory('Temporada 3')).toBe(3);
    expect(readSeasonDirectory('Saison 4')).toBe(4);
    expect(readSeasonDirectory('Stagione 5')).toBe(5);
  });

  it('reads the short form out of a release name', () => {
    expect(readSeasonDirectory('Family.Guy.S07.1080p.WEB-DL')).toBe(7);
  });

  it('does not read a year after a name ending in s as a season', () => {
    expect(readSeasonDirectory('Elvis 1977')).toBeNull();
  });

  it('does not read an episode written beside a season as the season alone', () => {
    expect(readSeasonDirectory('S01E01')).toBeNull();
  });
});
