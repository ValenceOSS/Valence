import { theColours } from '@ValenceMobile/theme/theColours';
import { coloursWithTheme } from './coloursWithTheme';

const dark = {
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
};

describe('coloursWithTheme', () => {
  it('keeps Valence’s own colours where no theme is chosen', () => {
    expect(coloursWithTheme(theColours.dark, null, 'dark')).toBe(theColours.dark);
  });

  it('lays a theme’s colours over Valence’s for the scheme it has', () => {
    const kept = { choice: 'night/sky', corners: 'standard' as const, dark };

    expect(coloursWithTheme(theColours.dark, kept, 'dark')).toEqual({
      accent: dark.accent,
      accentContrast: dark.accentContrast,
      border: dark.border,
      danger: dark.danger,
      highlight: dark.highlight,
      surface: dark.surface,
      surfaceRaised: dark.surfaceRaised,
      text: dark.text,
      textMuted: dark.textMuted,
    });
  });

  it('keeps Valence’s colours for a scheme the theme has none for', () => {
    const kept = { choice: 'night/sky', corners: 'standard' as const, dark };

    expect(coloursWithTheme(theColours.light, kept, 'light')).toBe(theColours.light);
  });
});
