import type { KeptPluginTheme } from '@ValenceClient/plugins/KeptPluginThemeSchema';

type Palette = {
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentContrast: string;
  danger: string;
  success: string;
};

/**
 * The television's colours with a plugin theme laid over them. A television is always dark, so only
 * a theme's dark colours are used; a theme with none leaves Valence's own in place.
 *
 * It is laid over once, as the app opens, before any screen is built: every screen's styles are made
 * from these values, so a theme chosen now is drawn the next time Valence opens.
 *
 * @param own - Valence's colours.
 * @param theme - The plugin theme kept on this television, where there is one.
 * @returns The colours to draw with.
 */
const paletteWithTheme = <Colours extends Palette>(
  own: Colours,
  theme: KeptPluginTheme | null,
): Colours => {
  const dark = theme?.dark;

  if (dark === undefined) {
    return own;
  }

  return {
    ...own,
    surface: dark.surface,
    surfaceRaised: dark.surfaceRaised,
    border: dark.border,
    text: dark.text,
    textMuted: dark.textMuted,
    accent: dark.accent,
    accentHover: dark.accent,
    accentContrast: dark.accentContrast,
    danger: dark.danger,
    success: dark.success,
  };
};

export { paletteWithTheme };
