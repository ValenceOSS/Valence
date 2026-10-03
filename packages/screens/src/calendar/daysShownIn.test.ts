import { describe, expect, it } from 'vitest';
import { daysShownIn } from './daysShownIn';

describe('daysShownIn', () => {
  it('shows a month’s whole grid', () => {
    expect(daysShownIn('month', '2026-10-17', '2026-10-02')).toEqual({
      from: '2026-09-28',
      to: '2026-11-08',
    });
  });

  it('shows a week from its Monday', () => {
    expect(daysShownIn('week', '2026-10-02', '2026-10-02')).toEqual({
      from: '2026-09-28',
      to: '2026-10-04',
    });
  });

  it('shows the upcoming list from today, wherever the calendar was turned to', () => {
    expect(daysShownIn('upcoming', '2027-03-01', '2026-10-02')).toEqual({
      from: '2026-10-02',
      to: '2026-11-30',
    });
  });
});
