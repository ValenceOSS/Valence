import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { CARD_GAP } from '@ValenceMobile/components/AShelf/CARD_GAP';

/**
 * Where each card of a shelf whose cards are all one width sits, so the shelf can be scrolled and
 * drawn without measuring each card first.
 *
 * @param cardWidth - How wide every card on it is.
 * @returns Where the card at a place along the shelf starts, and how wide it is.
 */
const cardsLaidOut =
  <Item>(cardWidth: number) =>
  (
    _cards: ArrayLike<Item> | null | undefined,
    index: number,
  ): { length: number; offset: number; index: number } => ({
    length: cardWidth,
    offset: SCREEN_EDGE + index * (cardWidth + CARD_GAP),
    index,
  });

export { cardsLaidOut };
