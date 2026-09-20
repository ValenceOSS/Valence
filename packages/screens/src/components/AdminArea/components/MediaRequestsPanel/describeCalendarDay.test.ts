import { describe, expect, it } from 'vitest';
import { describeCalendarDay } from './describeCalendarDay';

describe('describeCalendarDay', () => {
  it('says a calendar date as a person reads it, whatever the time zone', () => {
    expect(describeCalendarDay('2021-12-03')).toBe('3 Dec 2021');
  });
});
