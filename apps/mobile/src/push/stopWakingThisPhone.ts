import { requireOptionalNativeModule } from 'expo';
import { forgetThisPhone } from '@ValenceClient/notifications/forgetThisPhone';
import { thisPhonesPushAddress } from './thisPhonesPushAddress';
import type { NativeNotificationService } from './NativeNotificationService.types';

/**
 * Stops this phone being woken: the server forgets it, and the notification service extension
 * forgets the sign-in it read with. Done before signing out, while the server still knows who is
 * asking.
 */
const stopWakingThisPhone = async (): Promise<void> => {
  const address = await thisPhonesPushAddress();

  if (address !== null) {
    await forgetThisPhone(address.token);
  }

  requireOptionalNativeModule<NativeNotificationService>(
    'ValenceNotificationService',
  )?.forgetSignIn();
};

export { stopWakingThisPhone };
