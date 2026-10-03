import { describe, expect, it } from 'vitest';
import { describeReadingTime } from './describeReadingTime';

const AT = Date.UTC(2026, 9, 3, 14, 5, 9);

describe('describeReadingTime', () => {
  it('says the second for the last minute held in memory', () => {
    expect(describeReadingTime(AT, 'minute', 'en-GB')).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('says the minute over a day, without the second', () => {
    const said = describeReadingTime(AT, '24h', 'en-GB');

    expect(said).toMatch(/^\d{2}:\d{2}$/);
  });

  it('says the day of the week as well over several days', () => {
    const said = describeReadingTime(AT, '7d', 'en-GB');

    expect(said).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/);
    expect(said).toMatch(/\d{2}:\d{2}$/);
  });
});
