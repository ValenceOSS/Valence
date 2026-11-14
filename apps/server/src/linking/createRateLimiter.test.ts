import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './createRateLimiter';

describe('createRateLimiter', () => {
  it('allows each caller so many requests in a window, and then refuses them', () => {
    const allows = createRateLimiter({ most: 2, withinMs: 1000, now: () => 0 });

    expect([allows('a'), allows('a'), allows('a')]).toEqual([true, true, false]);
    expect(allows('b')).toBe(true);
  });

  it('refuses a new caller once as many are being counted as it will hold, until a window ends', () => {
    let at = 0;
    const allows = createRateLimiter({ most: 5, withinMs: 1000, now: () => at, mostCallers: 2 });

    expect([allows('a'), allows('b'), allows('c'), allows('a')]).toEqual([true, true, false, true]);

    at = 1000;

    expect(allows('c')).toBe(true);
  });

  it('starts again once the window has passed', () => {
    let at = 0;
    const allows = createRateLimiter({ most: 1, withinMs: 1000, now: () => at });

    expect([allows('a'), allows('a')]).toEqual([true, false]);

    at = 1000;

    expect(allows('a')).toBe(true);
  });
});
