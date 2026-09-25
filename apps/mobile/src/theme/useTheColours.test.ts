import { useColorScheme } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { chooseTheme } from '@ValenceClient/shell/theme';
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
});
