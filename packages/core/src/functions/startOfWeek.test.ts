import { describe, expect, it } from 'vitest';
import { startOfWeek } from './startOfWeek';

describe('startOfWeek', () => {
  it('goes back to the Monday, and stays on one', () => {
    expect(startOfWeek('2026-10-02')).toBe('2026-09-28');
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28');
    expect(startOfWeek('2026-09-28')).toBe('2026-09-28');
  });
});
