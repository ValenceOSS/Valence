import { describe, expect, it } from 'vitest';
import { addDays } from './addDays';

describe('addDays', () => {
  it('counts on and back across months and years', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-10-02', 0)).toBe('2026-10-02');
  });

  it('counts through the night the clocks go back as one day', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });
});
