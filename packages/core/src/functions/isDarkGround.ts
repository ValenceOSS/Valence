import { luminanceOf } from '@ValenceCore/functions/luminanceOf';

const DARK_BELOW = 0.03;

/**
 * Whether a colour is dark enough that something laid on it should be lighter than it, rather than
 * darker: near black, as a plain dark page is, rather than a colour of its own.
 *
 * @param colour - The colour beneath.
 * @returns Whether it is that dark; a colour that cannot be read counts as dark.
 */
const isDarkGround = (colour: string): boolean => (luminanceOf(colour) ?? 0) < DARK_BELOW;

export { isDarkGround };
