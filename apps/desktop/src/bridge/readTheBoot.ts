import { BootSchema } from '@ValenceDesktop/bridge/BootSchema';
import type { Boot } from '@ValenceDesktop/bridge/BootSchema';
import '@ValenceDesktop/TheWindow.types';

/**
 * Reads what the host's `/boot.js` left on the window before the page ran, standing in what is
 * missing or malformed with what a window knows before it has been told anything.
 *
 * @returns The values the page starts from.
 */
const readTheBoot = (): Boot => BootSchema.parse(window.__VALENCE_BOOT__);

export { readTheBoot };
