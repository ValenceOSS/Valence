import { drawnAvatarUrl } from '@ValenceContracts/functions/drawnAvatarUrl';

const BRING_THEIR_OWN_BACKGROUND: ReadonlySet<string> = new Set(['funEmoji', 'thumbs']);

/**
 * Where to read a drawn face from while it is being made. Most styles are read clear, with the
 * colour behind them painted where they are shown, so a colour being chosen shows at once; the
 * styles that draw a background of their own when given none are read already on the colour, since
 * their own background would cover one painted behind.
 *
 * @param style - The style it is drawn in.
 * @param seed - What picks the face among the style's.
 * @param colour - The colour it is drawn on, or nothing where it is clear.
 * @returns Its address.
 */
const drawingToShow = (style: string, seed: string, colour: string | null): string =>
  drawnAvatarUrl(style, seed, BRING_THEIR_OWN_BACKGROUND.has(style) ? colour : null);

export { drawingToShow };
