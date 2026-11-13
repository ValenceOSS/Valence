import { mixColours } from '@ValenceCore/functions/mixColours';

/**
 * The colours of the deck's three cards, back to front: the two behind only a little of the way from
 * the ground towards the ink, so they read as darker or lighter shades of the ground, and the ink
 * itself in front. Each is solid, so no card shows through the one over it.
 *
 * @param ink - The colour of the front card, as `#rrggbb`.
 * @param ground - The colour behind the deck, as `#rrggbb`.
 * @returns The three colours, back card first.
 */
const deckInks = (ink: string, ground: string): readonly [string, string, string] => [
  mixColours(ground, ink, 0.14),
  mixColours(ground, ink, 0.28),
  ink,
];

export { deckInks };
