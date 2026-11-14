import { describe, expect, it } from 'vitest';
import { dotOf } from './dotOf';

describe('dotOf', () => {
  it('adds the products of the features both vectors have', () => {
    expect(
      dotOf(
        new Map([
          ['a', 2],
          ['b', 3],
        ]),
        new Map([
          ['b', 4],
          ['c', 5],
        ]),
      ),
    ).toBe(12);
  });

  it('is nought where nothing is shared', () => {
    expect(dotOf(new Map([['a', 1]]), new Map())).toBe(0);
  });
});
