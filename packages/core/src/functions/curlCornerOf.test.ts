import { describe, expect, it } from 'vitest';
import { curlCornerOf } from './curlCornerOf';

describe('curlCornerOf', () => {
  const left = { x: 0, y: 0, width: 100, height: 200, spine: 'left' as const };

  it('lifts the free edge, top or bottom by where it was held', () => {
    expect(curlCornerOf(left, 40)).toEqual({ x: 100, y: 0 });
    expect(curlCornerOf(left, 160)).toEqual({ x: 100, y: 200 });
  });

  it('lifts the left edge of a page bound on the right', () => {
    expect(curlCornerOf({ ...left, spine: 'right' }, 10)).toEqual({ x: 0, y: 0 });
  });
});
