import { BackHandler, TVEventControl } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { menuKeyClaims } from '@ValenceTv/navigation/menuKeyClaims';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { useMenuToClose } from '@ValenceTv/navigation/useMenuToClose';

const PRESS = { type: 'hardwareBackPress', timeStamp: 0 };

const theRemote = () => {
  const held: { press: Parameters<typeof BackHandler.addEventListener>[1] | null } = {
    press: null,
  };

  return {
    held,
    enable: jest.spyOn(TVEventControl, 'enableTVMenuKey').mockImplementation(() => undefined),
    disable: jest.spyOn(TVEventControl, 'disableTVMenuKey').mockImplementation(() => undefined),
    listen: jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_type, handler) => {
      held.press = handler;

      return { remove: jest.fn() };
    }),
  };
};

beforeEach(() => {
  menuKeyClaims.isScreenHolding = false;
  menuKeyClaims.overlays = 0;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useMenuToClose', () => {
  it('takes Menu to close it over a part of the bar that leaves Menu to the system', async () => {
    const remote = theRemote();
    const close = jest.fn();

    await renderHook(() => {
      useMenuButton(null);
    });
    const { unmount } = await renderHook(() => {
      useMenuToClose(close);
    });

    expect(remote.enable).toHaveBeenCalledTimes(1);
    expect(remote.held.press?.(PRESS)).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);

    remote.disable.mockClear();
    await unmount();

    expect(remote.disable).toHaveBeenCalledTimes(1);
  });

  it('leaves the button held as it closes over a screen that holds it', async () => {
    const remote = theRemote();

    await renderHook(() => {
      useMenuButton(jest.fn());
    });
    const { unmount } = await renderHook(() => {
      useMenuToClose(jest.fn());
    });

    await unmount();

    expect(remote.disable).not.toHaveBeenCalled();
  });

  it('keeps the button while it is open, even where the screen beneath lets it go', async () => {
    const remote = theRemote();

    await renderHook(() => {
      useMenuToClose(jest.fn());
    });
    await renderHook(() => {
      useMenuButton(null);
    });

    expect(remote.disable).not.toHaveBeenCalled();
  });
});
