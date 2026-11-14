import { describe, expect, it } from 'vitest';
import { ticksOf } from './ticksOf';

describe('ticksOf', () => {
  it('counts ten million ticks to the second', () => {
    expect(ticksOf(1)).toBe(10_000_000);
    expect(ticksOf(60.021)).toBe(600_210_000);
  });
});
