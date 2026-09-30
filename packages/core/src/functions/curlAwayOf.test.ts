import { describe, expect, it } from 'vitest';
import { curlAwayOf } from './curlAwayOf';

describe('curlAwayOf', () => {
  it('mirrors a corner across a left spine', () => {
    const leaf = { x: 0, y: 0, width: 100, height: 150, spine: 'left' as const };

    expect(curlAwayOf(leaf, { x: 100, y: 0 })).toEqual({ x: -100, y: 0 });
  });

  it('mirrors a corner across a right spine', () => {
    const leaf = { x: 0, y: 0, width: 100, height: 150, spine: 'right' as const };

    expect(curlAwayOf(leaf, { x: 0, y: 150 })).toEqual({ x: 200, y: 150 });
  });
});
