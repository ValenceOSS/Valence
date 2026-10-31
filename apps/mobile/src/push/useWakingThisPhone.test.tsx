import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchNotificationSettings } from '@ValenceClient/notifications/fetchNotifications';
import { registerThisPhone } from '@ValenceClient/notifications/registerThisPhone';
import { useWakingThisPhone } from './useWakingThisPhone';
import { WAKES_THIS_PHONE } from './WAKES_THIS_PHONE';
import { NOTIFICATIONS_ALLOWED } from '@ValenceMobile/testing/NOTIFICATIONS_ALLOWED';

jest.mock('@ValenceClient/notifications/fetchNotifications', () => ({
  fetchNotificationSettings: jest.fn(),
}));

jest.mock('@ValenceClient/notifications/registerThisPhone', () => ({
  registerThisPhone: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('./shareTheSignIn', () => ({ shareTheSignIn: jest.fn(() => Promise.resolve(true)) }));

jest.mock('./stopWakingThisPhone', () => ({
  stopWakingThisPhone: jest.fn(() => Promise.resolve()),
}));

/**
 * Has the server offer, or not offer, to wake phones.
 *
 * @param wakesPhones - Whether it does.
 */
const theServerOffers = (wakesPhones: boolean) => {
  jest.mocked(fetchNotificationSettings).mockResolvedValue({
    preferences: [],
    pushPublicKey: '',
    wakesPhones,
  });
};

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(registerThisPhone).mockClear();
});

describe('useWakingThisPhone', () => {
  it('registers the phone as the app starts, where the server offers and notifications are allowed', async () => {
    theServerOffers(true);
    jest.mocked(getPermissionsAsync).mockResolvedValue(NOTIFICATIONS_ALLOWED);

    await renderHook(() => useWakingThisPhone({ keepsUp: true }), { wrapper: CacheScope });

    await waitFor(() => {
      expect(registerThisPhone).toHaveBeenCalledWith({
        platform: 'apple',
        token: 'a'.repeat(64),
        environment: 'sandbox',
      });
    });
  });

  it('leaves the phone alone where it was turned off here', async () => {
    theServerOffers(true);
    jest.mocked(getPermissionsAsync).mockResolvedValue(NOTIFICATIONS_ALLOWED);
    platformInUse().store.write(WAKES_THIS_PHONE, 'no');

    const { result } = await renderHook(() => useWakingThisPhone({ keepsUp: true }), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(result.current.isOffered).toBe(true);
    });
    expect(registerThisPhone).not.toHaveBeenCalled();
  });

  it('asks for permission when turned on, and registers once it is given', async () => {
    theServerOffers(true);
    jest.mocked(getPermissionsAsync).mockResolvedValue(NOTIFICATIONS_ALLOWED);
    jest.mocked(requestPermissionsAsync).mockResolvedValueOnce(NOTIFICATIONS_ALLOWED);

    const { result } = await renderHook(() => useWakingThisPhone(), { wrapper: CacheScope });

    await act(async () => {
      await result.current.turnOn();
    });

    expect(registerThisPhone).toHaveBeenCalled();
    expect(result.current.isOn).toBe(true);
  });

  it('offers nothing where the server does not wake phones', async () => {
    theServerOffers(false);

    const { result } = await renderHook(() => useWakingThisPhone({ keepsUp: true }), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(fetchNotificationSettings).toHaveBeenCalled();
    });
    expect(result.current.isOffered).toBe(false);
    expect(registerThisPhone).not.toHaveBeenCalled();
  });
});
