import { palette } from '@ValenceTv/theme/palette';
import type * as Palette from '@ValenceTv/theme/palette';

describe('palette', () => {
  it('reads the colours the app was configured with, by friendlier names', () => {
    expect(palette).toEqual({
      surface: '#0d0d0d',
      surfaceRaised: '#1a1a1a',
      border: '#2a2a2a',
      text: '#fafafa',
      textMuted: '#a0a0a0',
      accent: '#3a8ee8',
      accentHover: '#5aa0ee',
      accentContrast: '#ffffff',
      onWhite: '#000000',
      danger: '#e8503a',
      success: '#3ac47d',
      scrim: '#000000',
      onScrim: '#ffffff',
      line: '#333333',
      hover: '#222222',
      active: '#2c2c2c',
    });
  });

  it('lays the dark colours of a plugin theme chosen on this television over them', () => {
    jest.isolateModules(() => {
      const store = jest.requireMock<{ setItem: (key: string, value: string) => void }>(
        'expo-secure-store',
      );

      store.setItem('valence.pluginTheme', 'night-sky/midnight');
      store.setItem(
        'valence.pluginThemeColours',
        JSON.stringify({
          choice: 'night-sky/midnight',
          corners: 'standard',
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
        }),
      );

      const themed = jest.requireActual<typeof Palette>('@ValenceTv/theme/palette').palette;

      expect(themed.accent).toBe('#7c9cff');
      expect(themed.accentHover).toBe('#7c9cff');
      expect(themed.surface).toBe('#0b0d12');
      expect(themed.onScrim).toBe('#ffffff');
    });
  });

  it('fails loudly where the build lost its colours', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: {} } },
    }));

    expect(() => jest.requireActual<typeof Palette>('@ValenceTv/theme/palette')).toThrow(
      /palette/u,
    );
  });
});
