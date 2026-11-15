import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { CARD_GAP } from '@ValenceMobile/components/AShelf/CARD_GAP';
import { cardsLaidOut } from './cardsLaidOut';

describe('cardsLaidOut', () => {
  it('starts the first card in line with the page', () => {
    expect(cardsLaidOut<string>(208)(null, 0)).toEqual({
      length: 208,
      offset: SCREEN_EDGE,
      index: 0,
    });
  });

  it('sets each card after the one before it and the gap between them', () => {
    expect(cardsLaidOut<string>(104)(['a', 'b', 'c', 'd'], 3)).toEqual({
      length: 104,
      offset: SCREEN_EDGE + 3 * (104 + CARD_GAP),
      index: 3,
    });
  });
});
