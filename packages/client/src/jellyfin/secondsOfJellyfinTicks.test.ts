import { describe, expect, it } from 'vitest';
import { secondsOfJellyfinTicks } from './secondsOfJellyfinTicks';

describe('secondsOfJellyfinTicks', () => {
  it('counts ten million ticks to the second, and nought for none', () => {
    expect(secondsOfJellyfinTicks(600_210_000)).toBe(60.021);
    expect(secondsOfJellyfinTicks(null)).toBe(0);
  });
});
