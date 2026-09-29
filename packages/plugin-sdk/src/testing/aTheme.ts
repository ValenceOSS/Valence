import type { ThemeTokens } from '@ValenceSDK/theme/ThemeTokensSchema';

/**
 * A set of theme colours that reads well, for a test to spoil one of.
 *
 * @param changes - What this test changes.
 * @returns The colours.
 */
const aTheme = (changes: Partial<ThemeTokens> = {}): ThemeTokens => ({
  accent: '#3b82f6',
  accentContrast: '#000000',
  surface: '#0e0e0e',
  surfaceRaised: '#161616',
  text: '#f2f2f2',
  textMuted: '#a3a3a3',
  border: '#2e2e2e',
  danger: '#f87171',
  highlight: '#facc15',
  success: '#4ade80',
  ...changes,
});

export { aTheme };
