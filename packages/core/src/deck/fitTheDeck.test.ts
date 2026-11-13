import { describe, expect, it } from 'vitest';
import { fitTheDeck } from './fitTheDeck';

describe('fitTheDeck', () => {
  it('scales with the square it is set in', () => {
    expect(fitTheDeck(200).scale).toBeCloseTo(fitTheDeck(100).scale * 2);
  });

  it('moves the deck by as much more as the square is larger', () => {
    const small = fitTheDeck(100);
    const large = fitTheDeck(200);

    expect(large.shiftX).toBeCloseTo(small.shiftX * 2);
    expect(large.shiftY).toBeCloseTo(small.shiftY * 2);
  });

  it('fills a wide box to its height, and sets the deck in the middle of the width', () => {
    const wide = fitTheDeck(200, 100);
    const wider = fitTheDeck(1000, 100);

    expect(wider.scale).toBeCloseTo(wide.scale);
    expect(wider.shiftX - wide.shiftX).toBeCloseTo(400);
  });
});
