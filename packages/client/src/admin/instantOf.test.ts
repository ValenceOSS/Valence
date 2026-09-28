import { describe, expect, it } from 'vitest';
import { instantOf } from './instantOf';

describe('instantOf', () => {
  it('finds when a summer clock in London reads a given time', () => {
    expect(instantOf(Date.UTC(2026, 6, 1, 3, 0), 'Europe/London').toISOString()).toBe(
      '2026-07-01T02:00:00.000Z',
    );
  });

  it('finds when a clock in New York reads a given time', () => {
    expect(instantOf(Date.UTC(2026, 0, 15, 9, 0), 'America/New_York').toISOString()).toBe(
      '2026-01-15T14:00:00.000Z',
    );
  });
});
