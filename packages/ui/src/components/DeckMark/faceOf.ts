import { DECK } from './DECK';
import type { Face } from './DeckMark.types';

/**
 * Describes the smile or frown on a card, in the card's own space: the same arc each time, a frown
 * being the smile turned over.
 *
 * @param isSmile - Whether it is the front card's smile.
 * @returns The arc.
 */
const faceOf = (isSmile: boolean): Face => {
  const half = DECK.faceHalf * DECK.width;
  const sag = DECK.curve * DECK.height;
  const radius = (half * half + sag * sag) / (2 * sag);

  return {
    cx: DECK.archX * DECK.width,
    apex: isSmile ? DECK.archY * DECK.height : DECK.archY * DECK.height - sag,
    radius,
    half: Math.asin(half / radius),
    isSmile,
  };
};

export { faceOf };
