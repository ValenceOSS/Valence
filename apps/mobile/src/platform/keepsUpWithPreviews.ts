import { Platform } from 'react-native';
import { totalMemory } from 'expo-device';

const ENOUGH_MEMORY = 5 * 1024 ** 3;

/**
 * Whether this phone plays trailer previews while somebody browses. An Android phone with less than
 * 6 GB of memory has a decoder and a graphics chip that a full-width clip leaves too little of, so
 * its pages hold still on their pictures instead — scrolling and opening cards stay smooth there.
 *
 * @returns Whether to play them.
 */
const keepsUpWithPreviews = (): boolean =>
  Platform.OS !== 'android' || (totalMemory ?? ENOUGH_MEMORY) >= ENOUGH_MEMORY;

export { keepsUpWithPreviews };
