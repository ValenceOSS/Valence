import { useColorScheme } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { choosePluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { keepPluginTheme } from '@ValenceClient/plugins/keepPluginTheme';
import { PluginThemeSchema } from '@ValenceSDK/theme/PluginThemeSchema';
import { theColours } from './theColours';
import { useTheColours } from './useTheColours';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('useTheColours', () => {
  it('follows the phone where nobody has asked for a theme', async () => {
    jest.mocked(useColorScheme).mockReturnValue('light');

    expect((await renderHook(() => useTheColours())).result.current).toBe(theColours.light);
  });

  it('gives somebody the theme they asked for, whatever the phone is in', async () => {
    jest.mocked(useColorScheme).mockReturnValue('light');
    chooseTheme('dark');

    expect((await renderHook(() => useTheColours())).result.current).toBe(theColours.dark);
  });

  it('reads the same preference the browser client writes', async () => {
    jest.mocked(useColorScheme).mockReturnValue('dark');
    chooseTheme('light');

    expect((await renderHook(() => useTheColours())).result.current).toBe(theColours.light);
  });

  it('draws in a plugin theme chosen on this phone, for the scheme it has colours for', async () => {
    jest.mocked(useColorScheme).mockReturnValue('dark');
    const theme = PluginThemeSchema.parse({
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
    });

    keepPluginTheme('night-sky', theme);
    choosePluginTheme('night-sky/midnight');

    const colours = (await renderHook(() => useTheColours())).result.current;

    expect(colours.accent).toBe('#7c9cff');
    expect(colours.surface).toBe('#0b0d12');

    chooseTheme('light');

    expect((await renderHook(() => useTheColours())).result.current).toBe(theColours.light);
  });
});
