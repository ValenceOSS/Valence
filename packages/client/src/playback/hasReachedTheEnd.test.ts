import { describe, expect, it } from 'vitest';
import { hasReachedTheEnd } from './hasReachedTheEnd';

describe('whether playback has reached the end', () => {
  it('has, at the length the film was catalogued at', () => {
    expect(hasReachedTheEnd(7200, 7200)).toBe(true);
  });

  it('has, past it, where the last segment was appended after itself', () => {
    expect(hasReachedTheEnd(7203.4, 7200)).toBe(true);
  });

  it('has, within the last frames, since an element stops a hair short', () => {
    expect(hasReachedTheEnd(7199.9, 7200)).toBe(true);
  });

  it('has not, a few seconds out', () => {
    expect(hasReachedTheEnd(7196, 7200)).toBe(false);
  });

  it('has not, where the length is not yet known', () => {
    expect(hasReachedTheEnd(12, 0)).toBe(false);
    expect(hasReachedTheEnd(12, Number.NaN)).toBe(false);
    expect(hasReachedTheEnd(12, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
