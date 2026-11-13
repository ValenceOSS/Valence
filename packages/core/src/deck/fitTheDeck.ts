import { DECK } from './DECK';
import { DECK_SHARES } from './DECK_SHARES';
import { placeCard } from './placeCard';

/**
 * Works out how to set the fanned-out deck in a box: how much to scale it so it fills the box as far
 * as its proportions allow, and where to move it so it sits in the middle.
 *
 * @param width - How wide the box is.
 * @param height - How tall the box is, the same as its width unless said.
 * @returns The scale, then how far across and down to move the scaled deck.
 */
const fitTheDeck = (
  width: number,
  height: number = width,
): { scale: number; shiftX: number; shiftY: number } => {
  const corners = DECK_SHARES.map((share) => placeCard(share)).flatMap((card) =>
    [
      [0, 0],
      [DECK.width, 0],
      [0, DECK.height],
      [DECK.width, DECK.height],
    ].map(([x = 0, y = 0]) => [
      card[0] * x + card[2] * y + card[4],
      card[1] * x + card[3] * y + card[5],
    ]),
  );
  const xs = corners.map(([x = 0]) => x);
  const ys = corners.map(([, y = 0]) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const spread = Math.max(...xs) - left;
  const rise = Math.max(...ys) - top;
  const scale = Math.min(width / spread, height / rise);

  return {
    scale,
    shiftX: (width - spread * scale) / 2 - left * scale,
    shiftY: (height - rise * scale) / 2 - top * scale,
  };
};

export { fitTheDeck };
