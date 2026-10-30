import { isDarkGround } from '@ValenceCore/functions/isDarkGround';

const LIGHTER = 'rgba(255, 255, 255, 0.14)';

const DARKER = 'rgba(0, 0, 0, 0.32)';

/**
 * The fill for something laid on a ground, so it answers what is beneath it as the web's badges
 * over artwork do: a faint light one on near black, a see-through dark one on a colour of its own.
 *
 * @param ground - The colour beneath.
 * @returns The fill.
 */
const fillOn = (ground: string): string => (isDarkGround(ground) ? LIGHTER : DARKER);

export { fillOn };
