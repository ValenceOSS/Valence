import { getIosPushNotificationServiceEnvironmentAsync } from 'expo-application';
import { getDevicePushTokenAsync, getPermissionsAsync } from 'expo-notifications';
import { Platform } from 'react-native';
import type { PhonePush } from '@ValenceContracts/schemas/Notification';

/**
 * Where Apple can reach this phone with a push, without asking anybody anything: nothing where
 * notifications have not been allowed. An iPhone built for development is reached through Apple's
 * sandbox and one from the App Store or TestFlight through production, and the build itself says
 * which. Android is left out until the app is set up with Firebase.
 *
 * @returns The phone's platform, token and environment, or nothing.
 */
const thisPhonesPushAddress = async (): Promise<PhonePush | null> => {
  if (Platform.OS !== 'ios' || !(await getPermissionsAsync()).granted) {
    return null;
  }

  const token = await getDevicePushTokenAsync().catch(() => null);
  const environment = await getIosPushNotificationServiceEnvironmentAsync().catch(() => null);

  return token === null || typeof token.data !== 'string'
    ? null
    : {
        platform: 'apple',
        token: token.data,
        environment: environment === 'development' ? 'sandbox' : 'production',
      };
};

export { thisPhonesPushAddress };
