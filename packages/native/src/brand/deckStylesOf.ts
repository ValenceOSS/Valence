import { DECK } from '@ValenceCore/deck/DECK';
import { DECK_SHARES } from '@ValenceCore/deck/DECK_SHARES';
import { deckInks } from '@ValenceCore/deck/deckInks';
import { faceOf } from '@ValenceCore/deck/faceOf';
import { fitTheDeck } from '@ValenceCore/deck/fitTheDeck';
import { frownsAt } from '@ValenceCore/deck/frownsAt';
import { placeCard } from '@ValenceCore/deck/placeCard';

type Block = {
  position: 'absolute';
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius?: number;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  overflow?: 'hidden';
};

type Moved = {
  position: 'absolute';
  left: number;
  top: number;
  transformOrigin: string;
};

type DeckCardStyles = {
  card: Block & Moved & { transform: { matrix: number[] }[] };
  face: { position: 'absolute'; left: 0; top: 0; right: 0; bottom: 0; opacity: number };
  clip: Block;
  ring: Block;
  caps: [Block, Block];
};

type DeckStyles = {
  box: { width: number; height: number };
  deck: Moved & {
    transform: ({ translateX: number } | { translateY: number } | { scale: number })[];
  };
  cards: DeckCardStyles[];
};

/**
 * Works out how to draw Valence's mark as a deck of three cards with plain views: each card a
 * rounded block set in place by its matrix, and each face a ring cut down to its arc by a box that
 * clips it, with a round cap at either end, painted in the ground so it reads as a hole through the
 * card. Each client draws the views from these, as a phone and a television draw their own.
 *
 * @param width - How wide the box the deck sits in is.
 * @param height - How tall it is.
 * @param progress - How far the deck has fanned out, from 0 (stacked) to 1.
 * @param ink - The colour of the front card, as `#rrggbb`.
 * @param ground - The colour behind the deck, as `#rrggbb`.
 * @returns The styles of the box, of the deck within it, and of each card from the back.
 */
const deckStylesOf = (
  width: number,
  height: number,
  progress: number,
  ink: string,
  ground: string,
): DeckStyles => {
  const { scale, shiftX, shiftY } = fitTheDeck(width, height);
  const inks = deckInks(ink, ground);
  const thickness = DECK.thickness;

  return {
    box: { width, height },
    deck: {
      position: 'absolute',
      left: 0,
      top: 0,
      transformOrigin: 'top left',
      transform: [{ translateX: shiftX }, { translateY: shiftY }, { scale }],
    },
    cards: DECK_SHARES.map((share, index): DeckCardStyles => {
      const [a, b, c, d, e, f] = placeCard(share * progress);
      const face = faceOf(share === 0);
      const outer = face.radius + thickness / 2;
      const centreY = face.isSmile ? face.apex - face.radius : face.apex + face.radius;
      const endY = centreY + (face.isSmile ? 1 : -1) * face.radius * Math.cos(face.half);
      const endX = face.radius * Math.sin(face.half);
      const top = face.isSmile ? endY : face.apex - thickness / 2;
      const bottom = face.isSmile ? face.apex + thickness / 2 : endY;
      const cap = (x: number): Block => ({
        position: 'absolute',
        left: x - thickness / 2,
        top: endY - thickness / 2,
        width: thickness,
        height: thickness,
        borderRadius: thickness / 2,
        backgroundColor: ground,
      });

      return {
        card: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: DECK.width,
          height: DECK.height,
          borderRadius: DECK.corner,
          backgroundColor: inks[index] ?? ink,
          transformOrigin: 'top left',
          transform: [{ matrix: [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1] }],
        },
        face: {
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          opacity: face.isSmile ? 1 : frownsAt(progress),
        },
        clip: {
          position: 'absolute',
          left: face.cx - outer,
          top,
          width: outer * 2,
          height: bottom - top,
          overflow: 'hidden',
        },
        ring: {
          position: 'absolute',
          left: 0,
          top: centreY - outer - top,
          width: outer * 2,
          height: outer * 2,
          borderRadius: outer,
          borderWidth: thickness,
          borderColor: ground,
        },
        caps: [cap(face.cx - endX), cap(face.cx + endX)],
      };
    }),
  };
};

export type { DeckCardStyles, DeckStyles };

export { deckStylesOf };
