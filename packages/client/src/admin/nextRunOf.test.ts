import { describe, expect, it } from 'vitest';
import { nextRunOf } from './nextRunOf';

const NOW = new Date('2026-09-28T14:07:30Z');

describe('nextRunOf', () => {
  it('counts a step of minutes from the top of the hour', () => {
    expect(nextRunOf([{ kind: 'everyMinutes', minutes: 5 }], 'UTC', NOW)).toBe(
      Date.parse('2026-09-28T14:10:00Z'),
    );
  });

  it('rolls a step of minutes over into the next hour', () => {
    expect(
      nextRunOf([{ kind: 'everyMinutes', minutes: 15 }], 'UTC', new Date('2026-09-28T14:52:00Z')),
    ).toBe(Date.parse('2026-09-28T15:00:00Z'));
  });

  it('counts a step of hours from midnight', () => {
    expect(nextRunOf([{ kind: 'everyHours', hours: 4 }], 'UTC', NOW)).toBe(
      Date.parse('2026-09-28T16:00:00Z'),
    );
  });

  it('runs a daily trigger tomorrow once today has passed', () => {
    expect(nextRunOf([{ kind: 'daily', hour: 3, minute: 0 }], 'UTC', NOW)).toBe(
      Date.parse('2026-09-29T03:00:00Z'),
    );
  });

  it('runs a weekly trigger on its day', () => {
    expect(nextRunOf([{ kind: 'weekly', dayOfWeek: 0, hour: 6, minute: 0 }], 'UTC', NOW)).toBe(
      Date.parse('2026-10-04T06:00:00Z'),
    );
  });

  it('reads the trigger on the server’s clock', () => {
    expect(nextRunOf([{ kind: 'daily', hour: 16, minute: 0 }], 'Europe/London', NOW)).toBe(
      Date.parse('2026-09-28T15:00:00Z'),
    );
  });

  it('takes the earliest of several triggers', () => {
    expect(
      nextRunOf(
        [
          { kind: 'daily', hour: 3, minute: 0 },
          { kind: 'everyHours', hours: 1 },
        ],
        'UTC',
        NOW,
      ),
    ).toBe(Date.parse('2026-09-28T15:00:00Z'));
  });

  it('says nothing where only startup runs it', () => {
    expect(nextRunOf([{ kind: 'startup' }], 'UTC', NOW)).toBeNull();
  });
});
