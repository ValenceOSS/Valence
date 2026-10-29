import { describe, expect, it } from 'vitest';
import { formatDay } from './formatDay';

describe('formatDay', () => {
  it('writes a day out', () => {
    expect(formatDay('2026-10-29')).toBe('29 Oct 2026');
  });
});
