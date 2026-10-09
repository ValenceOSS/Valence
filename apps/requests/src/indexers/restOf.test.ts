import { describe, expect, it } from 'vitest';
import { restOf } from './restOf';

describe('restOf', () => {
  it('rests five minutes at first, and longer each time after, up to a day', () => {
    expect(restOf(0)).toBe(5 * 60_000);
    expect(restOf(1)).toBe(15 * 60_000);
    expect(restOf(7)).toBe(24 * 60 * 60_000);
    expect(restOf(40)).toBe(24 * 60 * 60_000);
  });
});
