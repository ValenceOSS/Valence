import { describe, expect, it } from 'vitest';
import { describeReleaseDate } from './describeReleaseDate';

describe('describeReleaseDate', () => {
  it('says a release date the way a person writes one', () => {
    expect(describeReleaseDate('2026-09-25')).toBe('25 September 2026');
  });

  it('reads the day itself, whatever the time zone of the machine', () => {
    expect(describeReleaseDate('2026-01-01')).toBe('1 January 2026');
  });
});
