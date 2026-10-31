import { describe, expect, it } from 'vitest';
import { fitsInWindow } from './fitsInWindow';

describe('fitsInWindow', () => {
  it('lets in as many as the limit within the window, and more once it has passed', () => {
    const kept = new Map<string, number[]>();

    expect(fitsInWindow(kept, 'a', 2, 1000, 0)).toBe(true);
    expect(fitsInWindow(kept, 'a', 2, 1000, 10)).toBe(true);
    expect(fitsInWindow(kept, 'a', 2, 1000, 20)).toBe(false);
    expect(fitsInWindow(kept, 'b', 2, 1000, 20)).toBe(true);
    expect(fitsInWindow(kept, 'a', 2, 1000, 1005)).toBe(true);
  });
});
