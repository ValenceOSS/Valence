import { getIosPushNotificationServiceEnvironmentAsync } from 'expo-application';
import { getDevicePushTokenAsync, getPermissionsAsync } from 'expo-notifications';
import { Platform } from 'react-native';
import type { PhonePush } from '@ValenceContracts/schemas/Notification';

/**
 * Where Apple or Google can reach this phone with a push, without asking anybody anything: nothing
 * where notifications have not been allowed. An iPhone built for development is reached through
 * Apple's sandbox and one from the App Store or TestFlight through production, and the build itself
 * says which. An Android phone is reached through Firebase, which has no sandbox, and only in a build
 * made with the app's Firebase settings; any other has no token to give.
 *
 * @returns The phone's platform, token and environment, or nothing.
 */
const thisPhonesPushAddress = async (): Promise<PhonePush | null> => {
  if (
    (Platform.OS !== 'ios' && Platform.OS !== 'android') ||
    !(await getPermissionsAsync()).granted
  ) {
    return null;
  }

  const token = await getDevicePushTokenAsync().catch(() => null);

  if (token === null || typeof token.data !== 'string') {
    return null;
  }

  if (Platform.OS === 'android') {
    return { platform: 'android', token: token.data, environment: 'production' };
  }

  const environment = await getIosPushNotificationServiceEnvironmentAsync().catch(() => null);

  return {
    platform: 'apple',
    token: token.data,
    environment: environment === 'development' ? 'sandbox' : 'production',
  };
};

export { thisPhonesPushAddress };
