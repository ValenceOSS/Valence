import { BackHandler, TVEventControl } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';

const PRESS = { type: 'hardwareBackPress', timeStamp: 0 };

const remove = jest.fn();

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

      return { remove };
    }),
  };
};

beforeEach(() => {
  remove.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useMenuButton', () => {
  it('takes Menu to go back while there is somewhere to go back to', async () => {
    const remote = theRemote();
    const back = jest.fn();

    await renderHook(() => {
      useMenuButton(back);
    });

    expect(remote.enable).toHaveBeenCalledTimes(1);
    expect(remote.held.press?.(PRESS)).toBe(true);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('gives Menu back to the system on the first screen', async () => {
    const remote = theRemote();

    await renderHook(() => {
      useMenuButton(null);
    });

    expect(remote.disable).toHaveBeenCalledTimes(1);
    expect(remote.listen).not.toHaveBeenCalled();
  });

  it('hears Menu inside a screen without taking the button for itself', async () => {
    const remote = theRemote();
    const back = jest.fn();

    await renderHook(() => {
      useMenuButton(back, true);
    });

    expect(remote.enable).not.toHaveBeenCalled();
    remote.held.press?.(PRESS);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('leaves the button alone inside a screen with nowhere to go back to', async () => {
    const remote = theRemote();

    await renderHook(() => {
      useMenuButton(null, true);
    });

    expect(remote.disable).not.toHaveBeenCalled();
  });

  it('stops listening when the screen goes', async () => {
    theRemote();

    const { unmount } = await renderHook(() => {
      useMenuButton(jest.fn());
    });

    await unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
