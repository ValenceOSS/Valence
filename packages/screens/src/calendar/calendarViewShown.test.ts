import { describe, expect, it } from 'vitest';
import { calendarViewShown } from './calendarViewShown';

describe('calendarViewShown', () => {
  it('shows the view asked for, and the month otherwise', () => {
    expect(calendarViewShown('week')).toBe('week');
    expect(calendarViewShown('upcoming')).toBe('upcoming');
    expect(calendarViewShown(null)).toBe('month');
    expect(calendarViewShown('year')).toBe('month');
  });
});
