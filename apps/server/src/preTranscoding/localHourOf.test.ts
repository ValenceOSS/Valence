import { describe, expect, it } from 'vitest';
import { localHourOf } from './localHourOf';

describe('localHourOf', () => {
  it('reads the hour on the clock of the zone asked about', () => {
    const moment = new Date('2026-07-01T23:30:00Z');

    expect(localHourOf(moment, 'UTC')).toBe(23);
    expect(localHourOf(moment, 'Europe/London')).toBe(0);
    expect(localHourOf(moment, 'America/New_York')).toBe(19);
  });

  it('says midnight as nought', () => {
    expect(localHourOf(new Date('2026-01-01T00:10:00Z'), 'UTC')).toBe(0);
  });
});
