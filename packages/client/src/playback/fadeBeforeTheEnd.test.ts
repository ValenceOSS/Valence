import { describe, expect, it } from 'vitest';
import { fadeBeforeTheEnd } from './fadeBeforeTheEnd';

describe('fadeBeforeTheEnd', () => {
  it('leaves an episode whole until its last moments', () => {
    expect(fadeBeforeTheEnd(100, 1200)).toBe(1);
    expect(fadeBeforeTheEnd(1197, 1200)).toBe(1);
  });

  it('falls away over the last moment and a half', () => {
    expect(fadeBeforeTheEnd(1199.0, 1200)).toBeCloseTo(0.5, 1);
  });

  it('is gone once the episode has reached its end', () => {
    expect(fadeBeforeTheEnd(1199.9, 1200)).toBe(0);
  });

  it('leaves alone something whose length is not known', () => {
    expect(fadeBeforeTheEnd(10, Number.NaN)).toBe(1);
    expect(fadeBeforeTheEnd(10, 0)).toBe(1);
  });
});
