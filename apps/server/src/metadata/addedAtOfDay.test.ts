import { describe, expect, it } from 'vitest';
import { addedAtOfDay } from './addedAtOfDay';

describe('addedAtOfDay', () => {
  it('takes midday of the day given, so it reads as that day everywhere', () => {
    expect(addedAtOfDay('2026-10-26').toISOString()).toBe('2026-10-26T12:00:00.000Z');
  });
});
