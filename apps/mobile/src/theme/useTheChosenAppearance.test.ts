import { Appearance } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { useTheChosenAppearance } from './useTheChosenAppearance';

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  forgetPlatform();
});

describe('useTheChosenAppearance', () => {
  it('leaves the appearance to the phone where nobody has asked for one', async () => {
    await renderHook(() => {
      useTheChosenAppearance();
    });

    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });

  it('puts what the system draws in the appearance somebody chose', async () => {
    chooseTheme('light');

    await renderHook(() => {
      useTheChosenAppearance();
    });

    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('light');
  });

  it('follows a change of mind while the app is open', async () => {
    await renderHook(() => {
      useTheChosenAppearance();
    });

    await act(() => {
      chooseTheme('dark');
    });

    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');

    await act(() => {
      chooseTheme('system');
    });

    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });
});
