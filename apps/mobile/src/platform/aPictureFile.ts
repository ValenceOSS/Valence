import { EncodingType, cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import type { SkImage } from '@shopify/react-native-skia';

/**
 * Saves a picture drawn on the phone as a PNG in the app's cache, so it can be sent like a photo
 * chosen from the library.
 *
 * @param image - The picture.
 * @param name - What to start the file's name with.
 * @returns Where the file is, or null where the cache cannot be written.
 */
const aPictureFile = async (image: SkImage, name: string): Promise<string | null> => {
  if (cacheDirectory === null) {
    return null;
  }

  const file = `${cacheDirectory}${name}-${Date.now().toString()}.png`;

  return writeAsStringAsync(file, image.encodeToBase64(), { encoding: EncodingType.Base64 })
    .then(() => file)
    .catch(() => null);
};

export { aPictureFile };
