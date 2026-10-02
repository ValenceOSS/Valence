import { describe, expect, it } from 'vitest';
import { nameTheDay } from './nameTheDay';

describe('nameTheDay', () => {
  it('calls today and tomorrow by name', () => {
    expect(nameTheDay('2026-10-02', '2026-10-02')).toBe('Today');
    expect(nameTheDay('2026-10-03', '2026-10-02')).toBe('Tomorrow');
  });

  it('names any other day by its weekday and date, with the year only where it is not this one', () => {
    expect(nameTheDay('2026-10-08', '2026-10-02', 'en-GB')).toBe('Thursday 8 October');
    expect(nameTheDay('2027-01-05', '2026-10-02', 'en-GB')).toMatch(/^Tuesday.*5 January 2027$/);
  });
});
