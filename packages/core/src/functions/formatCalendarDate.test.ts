import { describe, expect, it } from 'vitest';
import { formatCalendarDate } from './formatCalendarDate';

describe('formatCalendarDate', () => {
  it('says a day in words', () => {
    expect(formatCalendarDate('2021-09-15')).toBe('15 Sept 2021');
  });

  it('keeps the day it names, whichever zone the reader is in', () => {
    expect(formatCalendarDate('2021-01-01')).toBe('1 Jan 2021');
  });

  it('returns what it was given where that is not a date', () => {
    expect(formatCalendarDate('soon')).toBe('soon');
  });
});
