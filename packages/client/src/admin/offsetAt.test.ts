import { describe, expect, it } from 'vitest';
import { offsetAt } from './offsetAt';

describe('offsetAt', () => {
  it('reads London an hour ahead in summer', () => {
    expect(offsetAt(new Date('2026-07-01T12:00:00Z'), 'Europe/London')).toBe(3_600_000);
  });

  it('reads London level with UTC in winter', () => {
    expect(offsetAt(new Date('2026-01-15T12:00:00Z'), 'Europe/London')).toBe(0);
  });
});
