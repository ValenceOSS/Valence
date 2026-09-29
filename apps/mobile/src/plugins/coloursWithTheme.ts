import type { KeptPluginTheme } from '@ValenceClient/plugins/KeptPluginThemeSchema';
import type { Colours } from '@ValenceMobile/theme/theColours';

/**
 * Valence's colours with a plugin theme laid over them, for the scheme being drawn in. A theme that
 * has no colours for this scheme leaves Valence's own in place, rather than drawing a light theme
 * into a dark room.
 *
 * @param own - Valence's colours for the scheme.
 * @param theme - The plugin theme chosen, where one is.
 * @param scheme - Which scheme is being drawn.
 * @returns The colours to draw with.
 */
const coloursWithTheme = (
  own: Colours,
  theme: KeptPluginTheme | null,
  scheme: 'light' | 'dark',
): Colours => {
  const tokens = theme?.[scheme];

  if (tokens === undefined) {
    return own;
  }

  return {
    accent: tokens.accent,
    accentContrast: tokens.accentContrast,
    border: tokens.border,
    danger: tokens.danger,
    highlight: tokens.highlight,
    surface: tokens.surface,
    surfaceRaised: tokens.surfaceRaised,
    text: tokens.text,
    textMuted: tokens.textMuted,
  };
};

export { coloursWithTheme };
