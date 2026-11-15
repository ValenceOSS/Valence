import { renderHook } from '@testing-library/react-native';
import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
} from 'expo-notifications';
import type { NotificationResponse } from 'expo-notifications';
import { useNotificationTaps } from './useNotificationTaps';

/**
 * A notification somebody tapped, as the phone describes it.
 *
 * @param identifier - Which notification it was.
 * @param carrying - What the app put in it, and what the push brought with it.
 * @returns What the phone says was tapped.
 */
const aTap = (
  identifier: string,
  carrying: { data?: Record<string, string>; payload?: Record<string, string> },
): NotificationResponse => ({
  actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
  notification: {
    date: 0,
    request: {
      identifier,
      content: {
        title: 'Dune is ready',
        subtitle: null,
        body: null,
        categoryIdentifier: null,
        sound: null,
        launchImageName: null,
        badge: null,
        attachments: [],
        threadIdentifier: null,
        ...(carrying.data === undefined ? {} : { data: carrying.data }),
      },
      trigger: {
        type: 'push',
        ...(carrying.payload === undefined ? {} : { payload: carrying.payload }),
      },
    },
  },
});

/**
 * Taps a notification while the app is open.
 *
 * @param response - What the phone says was tapped.
 */
const tap = (response: NotificationResponse) => {
  for (const [listener] of jest.mocked(addNotificationResponseReceivedListener).mock.calls) {
    listener(response);
  }
};

beforeEach(() => {
  jest.mocked(addNotificationResponseReceivedListener).mockClear();
  jest.mocked(clearLastNotificationResponse).mockClear();
  jest.mocked(getLastNotificationResponse).mockReset().mockReturnValue(null);
});

describe('useNotificationTaps', () => {
  it('follows the notification that opened the app, and forgets it once followed', async () => {
    const onLink = jest.fn();

    jest
      .mocked(getLastNotificationResponse)
      .mockReturnValue(aTap('cold', { payload: { link: '/?item=dune', valence: '1' } }));

    await renderHook(() => {
      useNotificationTaps(onLink);
    });

    expect(onLink).toHaveBeenCalledWith('/?item=dune');
    expect(clearLastNotificationResponse).toHaveBeenCalled();
  });

  it('follows a notification tapped while the app is open', async () => {
    const onLink = jest.fn();

    await renderHook(() => {
      useNotificationTaps(onLink);
    });

    tap(aTap('open', { data: { link: '/?show=s-1' } }));

    expect(onLink).toHaveBeenCalledWith('/?show=s-1');
  });

  it('follows each notification only once', async () => {
    const onLink = jest.fn();

    jest
      .mocked(getLastNotificationResponse)
      .mockReturnValue(aTap('twice', { data: { link: '/?book=b' } }));

    await renderHook(() => {
      useNotificationTaps(onLink);
    });

    tap(aTap('twice', { data: { link: '/?book=b' } }));

    expect(onLink).toHaveBeenCalledTimes(1);
  });

  it('opens nothing for a notification that leads nowhere', async () => {
    const onLink = jest.fn();

    await renderHook(() => {
      useNotificationTaps(onLink);
    });

    tap(aTap('nowhere', {}));

    expect(onLink).not.toHaveBeenCalled();
  });

  it('stops listening once it is gone', async () => {
    const remove = jest.fn();

    jest.mocked(addNotificationResponseReceivedListener).mockReturnValueOnce({ remove });

    const drawn = await renderHook(() => {
      useNotificationTaps(jest.fn());
    });

    await drawn.unmount();

    expect(remove).toHaveBeenCalled();
  });
});
