import { paletteWithTheme } from './paletteWithTheme';

const own = {
  surface: 'rgba(13, 13, 13, 1)',
  surfaceRaised: 'rgba(26, 26, 26, 1)',
  border: 'rgba(42, 42, 42, 1)',
  text: 'rgba(250, 250, 250, 1)',
  textMuted: 'rgba(160, 160, 160, 1)',
  accent: 'rgba(58, 142, 232, 1)',
  accentHover: 'rgba(90, 160, 238, 1)',
  accentContrast: 'rgba(255, 255, 255, 1)',
  danger: 'rgba(232, 80, 58, 1)',
  success: 'rgba(58, 196, 125, 1)',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

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

describe('paletteWithTheme', () => {
  it('keeps Valence’s colours where no theme is kept', () => {
    expect(paletteWithTheme(own, null)).toBe(own);
  });

  it('lays a theme’s dark colours over Valence’s, and leaves the rest', () => {
    const themed = paletteWithTheme(own, { choice: 'night/sky', corners: 'standard', dark });

    expect(themed).toEqual({
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
    });
  });

  it('keeps Valence’s colours for a theme with only light ones', () => {
    expect(paletteWithTheme(own, { choice: 'day/sky', corners: 'round', light: dark })).toBe(own);
  });
});
