import { DECK } from './DECK';
import type { Matrix } from './DeckMark.types';

/**
 * Works out where one card of the deck sits: the same card leaned, tilted and narrowed the further
 * back it is.
 *
 * @param share - 0 for the front card, 1 for the back.
 * @returns The card's matrix.
 */
const placeCard = (share: number): Matrix => {
  const blend = (from: number, to: number, along: number) => from + (to - from) * along;
  const along = share * DECK.spread;
  const left = blend(DECK.frontAt[0], DECK.backAt[0], along);
  const bottom = blend(DECK.frontAt[1], DECK.backAt[1], along);
  const lean = Math.tan((blend(DECK.frontLean, DECK.backLean, share) * Math.PI) / 180);
  const tilt = Math.tan((blend(DECK.frontTilt, DECK.backTilt, share) * Math.PI) / 180);
  const narrow = blend(1, DECK.backWidth, share);

  return [narrow, -tilt * narrow, -lean, 1, left + lean * DECK.height, bottom - DECK.height];
};

export { placeCard };
