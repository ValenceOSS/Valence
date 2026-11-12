import { describe, expect, it } from 'vitest';
import { DECK } from './DECK';
import { faceOf } from './faceOf';

describe('faceOf', () => {
  it('draws the same arc for the smile and the frown, one turned over the other', () => {
    const smile = faceOf(true);
    const frown = faceOf(false);

    expect(smile.radius).toBe(frown.radius);
    expect(smile.half).toBe(frown.half);
    expect(smile.isSmile).toBe(true);
    expect(frown.isSmile).toBe(false);
  });

  it('centres the arc across the card and sinks it by its own depth', () => {
    const smile = faceOf(true);
    const frown = faceOf(false);

    expect(smile.cx).toBe(DECK.archX * DECK.width);
    expect(smile.apex).toBe(DECK.archY * DECK.height);
    expect(smile.apex - frown.apex).toBeCloseTo(DECK.curve * DECK.height);
  });

  it('spans the share of the card it is given', () => {
    const face = faceOf(true);

    expect(face.radius * Math.sin(face.half)).toBeCloseTo(DECK.faceHalf * DECK.width);
  });
});
