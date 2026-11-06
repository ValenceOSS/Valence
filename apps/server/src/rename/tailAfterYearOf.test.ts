import { describe, expect, it } from 'vitest';
import { tailAfterYearOf } from './tailAfterYearOf';

describe('tailAfterYearOf', () => {
  it('reads what a film’s name says after its year, and whether a dash sets it off', () => {
    expect(tailAfterYearOf('A Film - Part 2 (2011) Remux-2160p Proper', 2011)).toEqual({
      text: 'Remux-2160p Proper',
      isDashed: false,
    });
    expect(tailAfterYearOf('A Film (2000) - Extended Cut', 2000)).toEqual({
      text: 'Extended Cut',
      isDashed: true,
    });
    expect(tailAfterYearOf('a.film.2001.1080p.BluRay', 2001)).toEqual({
      text: '1080p.BluRay',
      isDashed: false,
    });
  });

  it('reads nothing where the name has no year, or nothing after it', () => {
    expect(tailAfterYearOf('A Film (2001)', 2001)).toBeNull();
    expect(tailAfterYearOf('a.film.2001', 2001)).toBeNull();
    expect(tailAfterYearOf('A Film', 2001)).toBeNull();
    expect(tailAfterYearOf('A Film (2001) [tmdbid-5]', 2001)).toBeNull();
    expect(tailAfterYearOf('2001 A Space Film', 1968)).toBeNull();
  });
});
