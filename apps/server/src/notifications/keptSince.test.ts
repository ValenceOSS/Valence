import { describe, expect, it } from 'vitest';
import { keptSince } from './keptSince';

describe('keptSince', () => {
  it('keeps notifications for ninety days', () => {
    expect(keptSince(new Date('2026-10-08T12:00:00.000Z')).toISOString()).toBe(
      '2026-07-10T12:00:00.000Z',
    );
  });
});
