import { describe, expect, it } from 'vitest';
import { yearOfDate } from './yearOfDate';

describe('yearOfDate', () => {
  it('reads the year from however much of a date MusicBrainz gives', () => {
    expect(yearOfDate('1973-03-01')).toBe(1973);
    expect(yearOfDate('1965')).toBe(1965);
  });

  it('gives nothing for no date, or one it cannot read', () => {
    expect(yearOfDate(null)).toBeNull();
    expect(yearOfDate('')).toBeNull();
  });
});
