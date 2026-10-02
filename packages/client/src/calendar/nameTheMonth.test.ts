import { describe, expect, it } from 'vitest';
import { nameTheMonth } from './nameTheMonth';

describe('nameTheMonth', () => {
  it('names the month and year a day falls in', () => {
    expect(nameTheMonth('2026-10-31', 'en-GB')).toBe('October 2026');
  });
});
