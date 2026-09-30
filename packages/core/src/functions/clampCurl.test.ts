import { describe, expect, it } from 'vitest';
import { clampCurl } from './clampCurl';

describe('clampCurl', () => {
  const leaf = { x: 0, y: 0, width: 100, height: 200, spine: 'left' as const };
  const corner = { x: 100, y: 0 };

  it('lets a corner go anywhere paper could put it', () => {
    expect(clampCurl(leaf, corner, { x: 50, y: 20 })).toEqual({ x: 50, y: 20 });
  });

  it('keeps the corner within a page’s width of the spine', () => {
    const kept = clampCurl(leaf, corner, { x: 300, y: 0 });

    expect(kept.x).toBeCloseTo(100);
    expect(kept.y).toBeCloseTo(0);
  });

  it('never carries the corner further from the spine’s far end than the diagonal', () => {
    const kept = clampCurl(leaf, corner, { x: 0, y: -100 });

    expect(Math.hypot(kept.x, kept.y - 200)).toBeLessThanOrEqual(Math.hypot(100, 200) + 1e-9);
  });
});
