import { describe, expect, it } from 'vitest';
import { formatEmailDate } from './formatEmailDate';

describe('formatEmailDate', () => {
  it('writes the day, month, year, time and zone', () => {
    expect(formatEmailDate(new Date('2026-10-09T14:05:00Z'), 'UTC')).toBe(
      '9 October 2026 at 14:05 UTC',
    );
  });
});
