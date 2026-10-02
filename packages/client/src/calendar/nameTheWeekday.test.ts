import { describe, expect, it } from 'vitest';
import { nameTheWeekday } from './nameTheWeekday';

describe('nameTheWeekday', () => {
  it('names the weekday a day falls on, whatever the zone', () => {
    expect(nameTheWeekday('2026-10-05', 'en-GB')).toBe('Mon');
    expect(nameTheWeekday('2026-10-04', 'en-GB')).toBe('Sun');
  });
});
