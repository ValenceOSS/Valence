import { Image } from 'expo-image';
import { heldCookies } from '@ValenceMobile/platform/heldCookies';

/**
 * Empties the pictures this phone has kept, from memory and from disk.
 *
 * Pictures are kept so a title shown twice is downloaded once, but they were fetched as whoever was
 * signed in, so they go when that person signs out rather than staying on the phone for whoever
 * signs in next. A cache that will not empty is not worth holding up signing out for. The cookies
 * they were fetched with go too, so the next picture is not asked for with a session that has ended.
 */
const forgetThePictures = async (): Promise<void> => {
  heldCookies.forget();
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]).catch(() => undefined);
};

export { forgetThePictures };
