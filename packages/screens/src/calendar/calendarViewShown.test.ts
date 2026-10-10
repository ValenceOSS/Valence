import { describe, expect, it } from 'vitest';
import { calendarViewShown } from './calendarViewShown';

describe('calendarViewShown', () => {
  it('shows the view asked for, and the timeline otherwise', () => {
    expect(calendarViewShown('week')).toBe('week');
    expect(calendarViewShown('upcoming')).toBe('upcoming');
    expect(calendarViewShown('month')).toBe('month');
    expect(calendarViewShown(null)).toBe('timeline');
    expect(calendarViewShown('year')).toBe('timeline');
  });
});
