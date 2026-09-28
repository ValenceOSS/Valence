import { PluginThemeSchema } from '@ValenceSDK/theme/PluginThemeSchema';
import type { PluginTheme } from '@ValenceSDK/theme/PluginThemeSchema';

/**
 * A readable dark plugin theme, for tests about choosing and drawing one.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns The theme.
 */
const aPluginTheme = (overrides: Partial<PluginTheme> = {}): PluginTheme =>
  PluginThemeSchema.parse({
    id: 'midnight',
    name: 'Midnight',
    dark: {
      accent: '#7c9cff',
      accentContrast: '#0b0d12',
      surface: '#0b0d12',
      surfaceRaised: '#151a24',
      text: '#f2f4f8',
      textMuted: '#a7b0c0',
      border: '#2a3242',
      danger: '#ff6b6b',
      highlight: '#ffd166',
      success: '#6bd68f',
    },
    ...overrides,
  });

export { aPluginTheme };
