import { describe, expect, it } from 'vitest';
import { isDeadlock } from './isDeadlock';

describe('isDeadlock', () => {
  it('knows a deadlock the database gave up on, through Drizzle’s wrapper', () => {
    expect(isDeadlock({ code: '40P01' })).toBe(true);
    expect(isDeadlock(new Error('Failed query', { cause: { code: '40P01' } }))).toBe(true);
  });

  it('does not mistake another failure for one', () => {
    expect(isDeadlock({ code: '23505' })).toBe(false);
    expect(isDeadlock(new Error('the network went away'))).toBe(false);
    expect(isDeadlock(null)).toBe(false);
  });
});
