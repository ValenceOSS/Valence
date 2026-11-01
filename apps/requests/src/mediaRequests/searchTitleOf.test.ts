import { describe, expect, it } from 'vitest';
import { searchTitleOf } from './searchTitleOf';

describe('searchTitleOf', () => {
  it('searches a film by its title and the year it came out', () => {
    expect(searchTitleOf({ kind: 'film', title: 'Star Trek', year: 2009 })).toBe('Star Trek 2009');
  });

  it('makes the title safe to search with before adding the year', () => {
    expect(searchTitleOf({ kind: 'film', title: 'Dune: Part Two (IMAX)', year: 2024 })).toBe(
      'Dune: Part Two IMAX 2024',
    );
  });

  it('leaves a title that already says its year as it is', () => {
    expect(searchTitleOf({ kind: 'film', title: 'Blade Runner 2049', year: 2049 })).toBe(
      'Blade Runner 2049',
    );
  });

  it('searches by the title alone where the year is not known, or for anything but a film', () => {
    expect(searchTitleOf({ kind: 'film', title: 'Star Trek', year: null })).toBe('Star Trek');
    expect(searchTitleOf({ kind: 'series', title: 'Star Trek', year: 1966 })).toBe('Star Trek');
  });
});
