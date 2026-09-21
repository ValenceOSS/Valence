import { describe, expect, it } from 'vitest';
import { describeAirDate } from './describeAirDate';

const TODAY = '2026-09-21';

describe('describeAirDate', () => {
  it('says an episode out today is out today', () => {
    expect(describeAirDate(TODAY, TODAY)).toBe('Airs today');
  });

  it('says tomorrow, and then the days, while it is close', () => {
    expect(describeAirDate('2026-09-22', TODAY)).toBe('Airs tomorrow');
    expect(describeAirDate('2026-09-28', TODAY)).toBe('Airs in 7 days');
    expect(describeAirDate('2026-10-05', TODAY)).toBe('Airs in 14 days');
  });

  it('gives the date once it is further off than a fortnight', () => {
    expect(describeAirDate('2026-10-06', TODAY)).toBe('Airs 6 Oct 2026');
  });

  it('says when a past episode aired', () => {
    expect(describeAirDate('2021-01-02', TODAY)).toBe('Aired 2 Jan 2021');
    expect(describeAirDate('2026-09-20', TODAY)).toBe('Aired 20 Sept 2026');
  });

  it('says nothing for what is not a date', () => {
    expect(describeAirDate('soon', TODAY)).toBe('');
    expect(describeAirDate(TODAY, 'now')).toBe('');
  });
});
