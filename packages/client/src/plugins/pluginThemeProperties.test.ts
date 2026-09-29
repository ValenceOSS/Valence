import { describe, expect, it } from 'vitest';
import { pluginThemeProperties } from './pluginThemeProperties';
import type { PluginTheme } from '@ValenceSDK/theme/PluginThemeSchema';

const DARK = {
  accent: '#3b82f6',
  accentContrast: '#ffffff',
  surface: '#0b0b10',
  surfaceRaised: '#15151c',
  text: '#f5f5f7',
  textMuted: '#a0a0aa',
  border: '#2a2a33',
  danger: '#f87171',
  highlight: '#facc15',
  success: '#4ade80',
};

const THEME: PluginTheme = { id: 'deep-sea', name: 'Deep sea', corners: 'round', dark: DARK };

describe('pluginThemeProperties', () => {
  it('turns a scheme into custom properties, with its corners', () => {
    const properties = pluginThemeProperties(THEME, 'dark');

    expect(properties?.['--color-accent']).toBe('#3b82f6');
    expect(properties?.['--color-accent-hover']).toBe('#3b82f6');
    expect(properties?.['--color-surface-raised']).toBe('#15151c');
    expect(properties?.['--radius-scale']).toBe('1.6');
  });

  it('has nothing for a scheme the theme does not offer', () => {
    expect(pluginThemeProperties(THEME, 'light')).toBeNull();
  });

  it('refuses anything that is not a colour', () => {
    expect(() =>
      pluginThemeProperties(
        { ...THEME, dark: { ...DARK, accent: 'red;background:url(x)' } },
        'dark',
      ),
    ).toThrow();
  });
});
