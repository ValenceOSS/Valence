import { describe, expect, it } from 'vitest';
import { formatCount } from './formatCount';

describe('formatCount', () => {
  it('groups the thousands', () => {
    expect(formatCount(1234567)).toBe('1,234,567');
    expect(formatCount(12)).toBe('12');
  });
});
