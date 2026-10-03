import { describe, expect, it } from 'vitest';
import { nameTheWeek } from './nameTheWeek';

describe('nameTheWeek', () => {
  it('names the Monday to Sunday a day falls in', () => {
    const named = nameTheWeek('2026-10-02', 'en-GB');

    expect(named).toContain('28');
    expect(named).toContain('4');
    expect(named).toContain('Oct');
    expect(named).toContain('2026');
  });
});
