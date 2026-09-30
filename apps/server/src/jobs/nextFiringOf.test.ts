import { describe, expect, it } from 'vitest';
import { nextFiringOf } from './nextFiringOf';

describe('nextFiringOf', () => {
  it('fires at the next moment the cron names', () => {
    expect(nextFiringOf('*/15 * * * *', 'UTC', new Date('2026-09-30T10:07:00Z'))).toEqual(
      new Date('2026-09-30T10:15:00Z'),
    );
  });

  it('does not count a firing at the very moment it looks from', () => {
    expect(nextFiringOf('0 * * * *', 'UTC', new Date('2026-09-30T10:00:00Z'))).toEqual(
      new Date('2026-09-30T11:00:00Z'),
    );
  });

  it('reads the cron in the zone it was set in', () => {
    expect(nextFiringOf('0 3 * * *', 'Europe/London', new Date('2026-07-01T00:00:00Z'))).toEqual(
      new Date('2026-07-01T02:00:00Z'),
    );
  });

  it('refuses a cron it cannot read', () => {
    expect(() => nextFiringOf('whenever', 'UTC', new Date())).toThrow();
  });
});
