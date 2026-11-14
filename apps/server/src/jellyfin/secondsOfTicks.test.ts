import { describe, expect, it } from 'vitest';
import { secondsOfTicks } from './secondsOfTicks';

describe('secondsOfTicks', () => {
  it('turns ticks back into seconds', () => {
    expect(secondsOfTicks(250_000_000)).toBe(25);
  });
});
