import { describe, expect, it } from 'vitest';
import { pageCurlOf } from './pageCurlOf';

describe('pageCurlOf', () => {
  const leaf = { x: 0, y: 0, width: 100, height: 100, spine: 'left' as const };

  it('splits the page into what lies flat and the flap that has come up', () => {
    const curl = pageCurlOf(leaf, { x: 100, y: 0 }, { x: 60, y: 0 });

    expect(curl?.fold.at).toEqual({ x: 80, y: 0 });
    expect(curl?.front.map((point) => point.x)).toEqual([0, 80, 80, 0]);
    expect(curl?.flap.map((point) => point.x)).toEqual([80, 100, 100, 80]);
    expect(curl?.reflect[4]).toBe(160);
  });

  it('is nothing while the corner has hardly moved', () => {
    expect(pageCurlOf(leaf, { x: 100, y: 0 }, { x: 100, y: 0 })).toBeNull();
  });
});
