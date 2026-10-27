import { describe, expect, it } from 'vitest';
import { daysBefore } from './daysBefore';

describe('daysBefore', () => {
  it('counts back whole days', () => {
    expect(daysBefore(new Date('2026-10-27T12:00:00.000Z'), 30).toISOString()).toBe(
      '2026-09-27T12:00:00.000Z',
    );
  });
});
