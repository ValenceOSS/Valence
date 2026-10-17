import { describe, expect, it } from 'vitest';
import { localTime } from './localTime';

describe('localTime', () => {
  it('reads a moment on the clock of a zone', () => {
    expect(localTime('America/New_York')(new Date('2026-10-17T03:30:00Z'))).toEqual({
      day: '2026-10-16',
      weekday: 4,
      hour: 23,
    });
  });

  it('reads a zone it does not know as UTC', () => {
    expect(localTime('Nowhere/Special')(new Date('2026-10-19T08:00:00Z'))).toEqual({
      day: '2026-10-19',
      weekday: 0,
      hour: 8,
    });
  });
});
