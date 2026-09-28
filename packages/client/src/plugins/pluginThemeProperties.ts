import { HexColourSchema } from '@ValenceSDK/theme/HexColourSchema';
import type { PluginTheme } from '@ValenceSDK/theme/PluginThemeSchema';
import type { ThemeTokens } from '@ValenceSDK/theme/ThemeTokensSchema';

const PROPERTIES: Readonly<Record<keyof ThemeTokens, readonly string[]>> = {
  accent: ['--color-accent', '--color-accent-hover'],
  accentContrast: ['--color-accent-contrast'],
  surface: ['--color-surface'],
  surfaceRaised: ['--color-surface-raised'],
  text: ['--color-text'],
  textMuted: ['--color-text-muted'],
  border: ['--color-border'],
  danger: ['--color-danger'],
  highlight: ['--color-highlight'],
  success: ['--color-success'],
};

const CORNERS: Readonly<Record<PluginTheme['corners'], string>> = {
  sharp: '0.35',
  standard: '1',
  round: '1.6',
};

const OWNED = [...Object.values(PROPERTIES).flat(), '--radius-scale'];

/**
 * The custom properties a plugin theme sets for the scheme in force, where it has one for it. Every
 * colour is checked again as six hex digits on the way, so nothing a theme holds can ever be read
 * as anything but a colour.
 *
 * @param theme - The theme.
 * @param scheme - Whether the page is dark or light right now.
 * @returns Each property and its value, or nothing where the theme has no colours for this scheme.
 */
const pluginThemeProperties = (
  theme: PluginTheme,
  scheme: 'dark' | 'light',
): Record<string, string> | null => {
  const tokens = theme[scheme];

  if (tokens === undefined) {
    return null;
  }

  const properties: Record<string, string> = { '--radius-scale': CORNERS[theme.corners] };

  for (const [token, owned] of Object.entries(PROPERTIES)) {
    if (token in tokens) {
      const colour = HexColourSchema.parse(Reflect.get(tokens, token));

      for (const property of owned) {
        properties[property] = colour;
      }
    }
  }

  return properties;
};

export { OWNED, pluginThemeProperties };
