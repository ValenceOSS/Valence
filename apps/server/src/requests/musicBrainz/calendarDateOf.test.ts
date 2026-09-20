import { describe, expect, it } from 'vitest';
import { calendarDateOf } from './calendarDateOf';

describe('calendarDateOf', () => {
  it('reads a whole date, a month or a year as a day', () => {
    expect(calendarDateOf('1979-11-30')).toBe('1979-11-30');
    expect(calendarDateOf('1979-11')).toBe('1979-11-01');
    expect(calendarDateOf('1979')).toBe('1979-01-01');
  });

  it('reads nothing as no day', () => {
    expect(calendarDateOf('')).toBeNull();
  });
});
