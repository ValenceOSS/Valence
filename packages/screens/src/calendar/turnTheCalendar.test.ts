import { describe, expect, it } from 'vitest';
import { turnTheCalendar } from './turnTheCalendar';

describe('turnTheCalendar', () => {
  it('turns a month at a time to the first of the month, across years', () => {
    expect(turnTheCalendar('month', '2026-10-31', 1)).toBe('2026-11-01');
    expect(turnTheCalendar('month', '2026-12-15', 1)).toBe('2027-01-01');
    expect(turnTheCalendar('month', '2026-01-15', -1)).toBe('2025-12-01');
  });

  it('turns a week at a time', () => {
    expect(turnTheCalendar('week', '2026-10-02', 1)).toBe('2026-10-09');
    expect(turnTheCalendar('week', '2026-10-02', -1)).toBe('2026-09-25');
  });
});
