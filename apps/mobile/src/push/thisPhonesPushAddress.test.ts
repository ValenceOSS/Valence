import { getIosPushNotificationServiceEnvironmentAsync } from 'expo-application';
import { getDevicePushTokenAsync, getPermissionsAsync } from 'expo-notifications';
import { Platform } from 'react-native';
import { thisPhonesPushAddress } from './thisPhonesPushAddress';
import { NOTIFICATIONS_ALLOWED } from '@ValenceMobile/testing/NOTIFICATIONS_ALLOWED';

describe('thisPhonesPushAddress', () => {
  it('answers nothing where notifications have not been allowed', async () => {
    expect(await thisPhonesPushAddress()).toBeNull();
  });

  it('answers the token, reached through the sandbox for a development build', async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(NOTIFICATIONS_ALLOWED);

    expect(await thisPhonesPushAddress()).toEqual({
      platform: 'apple',
      token: 'a'.repeat(64),
      environment: 'sandbox',
    });
  });

  it('is reached through production for a build from the App Store or TestFlight', async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(NOTIFICATIONS_ALLOWED);
    jest.mocked(getIosPushNotificationServiceEnvironmentAsync).mockResolvedValueOnce('production');

    expect((await thisPhonesPushAddress())?.environment).toBe('production');
  });

  it('answers a Firebase token on Android, which has no sandbox', async () => {
    const was = Platform.OS;

    Platform.OS = 'android';
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(NOTIFICATIONS_ALLOWED);
    jest
      .mocked(getDevicePushTokenAsync)
      .mockResolvedValueOnce({ type: 'android', data: 'f'.repeat(80) });

    expect(await thisPhonesPushAddress()).toEqual({
      platform: 'android',
      token: 'f'.repeat(80),
      environment: 'production',
    });

    Platform.OS = was;
  });

  it('answers nothing on Android in a build made without Firebase', async () => {
    const was = Platform.OS;

    Platform.OS = 'android';
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(NOTIFICATIONS_ALLOWED);
    jest.mocked(getDevicePushTokenAsync).mockRejectedValueOnce(new Error('no Firebase'));

    expect(await thisPhonesPushAddress()).toBeNull();

    Platform.OS = was;
  });
});
