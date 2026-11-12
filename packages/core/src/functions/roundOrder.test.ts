import { describe, expect, it } from 'vitest';
import { roundOrder } from './roundOrder';

describe('roundOrder', () => {
  it('puts every row in once', () => {
    expect([...roundOrder(7, 2)].sort((left, right) => left - right)).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
  });

  it('gives the same order each time a round is asked for, and another for another round', () => {
    expect(roundOrder(9, 1)).toEqual(roundOrder(9, 1));
    expect(roundOrder(9, 1)).not.toEqual(roundOrder(9, 2));
  });

  it('has nothing to order where there are no rows', () => {
    expect(roundOrder(0, 1)).toEqual([]);
  });
});
