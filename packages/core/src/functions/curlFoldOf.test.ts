import { describe, expect, it } from 'vitest';
import { curlFoldOf } from './curlFoldOf';

describe('curlFoldOf', () => {
  it('folds halfway between the corner and the pointer, square to the pull', () => {
    expect(curlFoldOf({ x: 100, y: 0 }, { x: 60, y: 0 })).toEqual({
      at: { x: 80, y: 0 },
      normal: { x: -1, y: 0 },
    });
  });

  it('has no crease while the corner has hardly moved', () => {
    expect(curlFoldOf({ x: 100, y: 0 }, { x: 100.2, y: 0 })).toBeNull();
  });
});
