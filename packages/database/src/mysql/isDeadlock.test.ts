import { describe, expect, it } from 'vitest';
import { isDeadlock } from './isDeadlock';

describe('isDeadlock', () => {
  it('knows a deadlock the database gave up on, through Drizzle’s wrapper', () => {
    expect(isDeadlock({ errno: 1213 })).toBe(true);
    expect(isDeadlock(new Error('Failed query', { cause: { errno: 1213 } }))).toBe(true);
  });

  it('does not mistake another failure for one', () => {
    expect(isDeadlock({ errno: 1062 })).toBe(false);
    expect(isDeadlock(new Error('the network went away'))).toBe(false);
    expect(isDeadlock(null)).toBe(false);
  });
});
