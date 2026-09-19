import { describe, expect, it } from 'vitest';
import { readRelativeTime } from './readRelativeTime';

const NOW = Date.parse('2026-09-19T12:00:00.000Z');

describe('readRelativeTime', () => {
  it.each([
    ['now', 0],
    ['just now', 0],
    ['2 hours and 1 day', 26 * 3_600_000],
    ['9hr,12m,39s', (9 * 3600 + 12 * 60 + 39) * 1000],
    ['4 years ago', 4 * 365 * 86_400_000],
    ['1 week', 7 * 86_400_000],
    ['5 months', 150 * 86_400_000],
    ['1.5 days ago', 36 * 3_600_000],
    ['3 mins', 180_000],
  ])('reads %s', (text, ago) => {
    expect(readRelativeTime(text, NOW)?.getTime()).toBe(NOW - ago);
  });

  it('reads nothing that is not a length of time', () => {
    expect(readRelativeTime('yesterday', NOW)).toBeNull();
    expect(readRelativeTime('3 fortnights', NOW)).toBeNull();
  });
});
