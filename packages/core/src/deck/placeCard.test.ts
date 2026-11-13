import { describe, expect, it } from 'vitest';
import { DECK } from './DECK';
import { placeCard } from './placeCard';

describe('placeCard', () => {
  it('puts the front card full width, its foot at the front corner, leaned forward', () => {
    const [narrow, , lean, height, left, top] = placeCard(0);
    const slope = Math.tan((DECK.frontLean * Math.PI) / 180);

    expect(narrow).toBe(1);
    expect(height).toBe(1);
    expect(lean).toBeCloseTo(-slope);
    expect(left).toBeCloseTo(DECK.frontAt[0] + slope * DECK.height);
    expect(top).toBe(DECK.frontAt[1] - DECK.height);
  });

  it('narrows the back card and sets it nearly the whole way to the back corner', () => {
    const [narrow, , , , , top] = placeCard(1);

    expect(narrow).toBe(DECK.backWidth);
    expect(top).toBeCloseTo(
      DECK.frontAt[1] + (DECK.backAt[1] - DECK.frontAt[1]) * DECK.spread - DECK.height,
    );
  });

  it('sets the middle card halfway between the two', () => {
    expect(placeCard(0.5)[0]).toBeCloseTo((1 + DECK.backWidth) / 2);
  });
});
