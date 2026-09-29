import { ICON_GLYPHS } from './ICON_GLYPHS';
import type { IconGlyphName } from './ICON_GLYPHS';
import type { IconName } from './IconNameSchema';

/**
 * The Keyline icon a plugin's icon name is drawn as, taken from whichever of Keyline's sets a
 * client draws with, so every client draws the same picture for the same name.
 *
 * @param set - The client's icons, by their Keyline name.
 * @param name - The icon the plugin asked for.
 * @returns The icon to draw.
 */
const glyphFor = <Glyph>(set: Readonly<Record<IconGlyphName, Glyph>>, name: IconName): Glyph =>
  set[ICON_GLYPHS[name]];

export { glyphFor };
