import { describe, expect, it } from 'vitest';
import { liveWindowAt } from '@ValenceClient/live/liveWindowAt';

describe('liveWindowAt', () => {
  it('starts at the half hour the moment falls in and runs four hours', () => {
    expect(liveWindowAt(Date.parse('2026-10-28T20:47:12Z'))).toEqual({
      from: Date.parse('2026-10-28T20:30:00Z'),
      until: Date.parse('2026-10-29T00:30:00Z'),
    });
  });

  it('starts on the moment itself when that is a half hour', () => {
    expect(liveWindowAt(Date.parse('2026-10-28T21:00:00Z')).from).toBe(
      Date.parse('2026-10-28T21:00:00Z'),
    );
  });
});
