import { getIosPushNotificationServiceEnvironmentAsync } from 'expo-application';
import { getPermissionsAsync } from 'expo-notifications';
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
});
