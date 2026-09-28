import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';

/**
 * The notice Valence draws in place of a plugin's page or panel when the plugin cannot be drawn.
 *
 * @param title - What went wrong, in a few words.
 * @param text - What to do about it.
 * @returns The notice.
 */
const serviceNotice = (title: string, text: string): Surface => ({
  blocks: [{ type: 'notice', tone: 'warning', title, text }],
});

export { serviceNotice };
