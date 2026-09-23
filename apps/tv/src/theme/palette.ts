import Constants from 'expo-constants';
import { z } from 'zod';

const PaletteSchema = z.object({
  'color-surface': z.string(),
  'color-surface-raised': z.string(),
  'color-border': z.string(),
  'color-text': z.string(),
  'color-text-muted': z.string(),
  'color-accent': z.string(),
  'color-accent-hover': z.string(),
  'color-accent-contrast': z.string(),
  'color-on-white': z.string(),
  'color-danger': z.string(),
  'color-success': z.string(),
  'color-scrim': z.string(),
  'color-on-scrim': z.string(),
  'surface-line': z.string(),
  'surface-hover': z.string(),
  'surface-active': z.string(),
});

const ExtraSchema = z.object({ palette: PaletteSchema });

/**
 * Reads ValenceUI's dark palette, as the app's config handed it over.
 *
 * The colours are read out of ValenceUI's own stylesheet when the app is configured, so the television
 * draws with exactly the colours the web does. A build that somehow lost them fails loudly here on
 * the way up rather than drawing in colours nobody chose.
 *
 * @returns The colours, by the names the stylesheet gives them.
 */
const readThePalette = () => ExtraSchema.parse(Constants.expoConfig?.extra);

const read = readThePalette();

const palette = {
  surface: read.palette['color-surface'],
  surfaceRaised: read.palette['color-surface-raised'],
  border: read.palette['color-border'],
  text: read.palette['color-text'],
  textMuted: read.palette['color-text-muted'],
  accent: read.palette['color-accent'],
  accentHover: read.palette['color-accent-hover'],
  accentContrast: read.palette['color-accent-contrast'],
  onWhite: read.palette['color-on-white'],
  danger: read.palette['color-danger'],
  success: read.palette['color-success'],
  scrim: read.palette['color-scrim'],
  onScrim: read.palette['color-on-scrim'],
  line: read.palette['surface-line'],
  hover: read.palette['surface-hover'],
  active: read.palette['surface-active'],
};

export { palette };
