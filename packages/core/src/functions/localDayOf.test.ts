import { describe, expect, it } from 'vitest';
import { localDayOf } from './localDayOf';

describe('localDayOf', () => {
  it('reads the day on the local clock, padded', () => {
    expect(localDayOf(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
    expect(localDayOf(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});
