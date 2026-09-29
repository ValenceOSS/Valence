import { requireOptionalNativeModule } from 'expo';
import type { NativeCarPlay } from '@ValenceMobile/carPlay/NativeCarPlay.types';

/**
 * CarPlay, where this build of the phone app can draw into it.
 *
 * @returns The module, or nothing on a phone with no CarPlay, as every Android one is.
 */
const theCar = (): NativeCarPlay | null =>
  requireOptionalNativeModule<NativeCarPlay>('ValenceCarPlay');

export { theCar };
