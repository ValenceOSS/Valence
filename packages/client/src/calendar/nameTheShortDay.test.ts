import { describe, expect, it } from 'vitest';
import { nameTheShortDay } from './nameTheShortDay';

describe('nameTheShortDay', () => {
  it('names the weekday and the date in the month, whatever the zone', () => {
    expect(nameTheShortDay('2026-10-05', 'en-GB')).toBe('Mon 5');
    expect(nameTheShortDay('2026-10-04', 'en-GB')).toBe('Sun 4');
  });
});
