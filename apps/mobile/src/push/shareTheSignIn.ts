import { requireOptionalNativeModule } from 'expo';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import type { NativeNotificationService } from './NativeNotificationService.types';

/**
 * Hands the notification service extension the server this phone is signed in to and the session it
 * holds there, so the extension can read what a push woke the phone to say. Handed again whenever
 * the app comes back, since the session moves on as it is used.
 *
 * @returns Whether it was handed over.
 */
const shareTheSignIn = async (): Promise<boolean> => {
  const extension = requireOptionalNativeModule<NativeNotificationService>(
    'ValenceNotificationService',
  );
  const address = platformInUse().serverAddress();
  const cookie = address === null ? null : await theCookiesThisPhoneHolds(address);

  return extension !== null && address !== null && cookie !== null
    ? extension.shareSignIn(address, cookie)
    : false;
};

export { shareTheSignIn };
