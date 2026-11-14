import { describe, expect, it } from 'vitest';
import { unitOf } from './unitOf';

describe('unitOf', () => {
  it('scales a vector to length one', () => {
    expect(
      unitOf(
        new Map([
          ['a', 3],
          ['b', 4],
        ]),
      ),
    ).toEqual(
      new Map([
        ['a', 0.6],
        ['b', 0.8],
      ]),
    );
  });

  it('leaves a vector with no length empty', () => {
    expect(unitOf(new Map([['a', 0]]))).toEqual(new Map());
  });
});
