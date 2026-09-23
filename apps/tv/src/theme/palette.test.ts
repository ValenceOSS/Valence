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
