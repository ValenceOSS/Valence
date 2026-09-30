import { describe, expect, it } from 'vitest';
import { easeOutCubic } from './easeOutCubic';

describe('easeOutCubic', () => {
  it('starts and ends where it should', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('is quick to arrive', () => {
    expect(easeOutCubic(0.5)).toBe(0.875);
  });
});
