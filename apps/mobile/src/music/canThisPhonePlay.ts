import { Platform } from 'react-native';

/**
 * Whether this phone plays a kind of audio file: an iPhone plays everything but Ogg, and Android
 * plays it all.
 *
 * @param type - The file's type.
 * @returns Whether it plays.
 */
const canThisPhonePlay = (type: string): boolean =>
  Platform.OS === 'android' || !type.startsWith('audio/ogg');

export { canThisPhonePlay };
