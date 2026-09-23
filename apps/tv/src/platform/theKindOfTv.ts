import { Platform } from 'react-native';

/**
 * What kind of television this is, as a person would name the box: an Apple TV or an Android TV.
 *
 * @param system - Which system it runs, which is this television's own unless a test says otherwise.
 * @returns The kind of television.
 */
const theKindOfTv = (system: typeof Platform.OS = Platform.OS): string =>
  system === 'android' ? 'Android TV' : 'Apple TV';

export { theKindOfTv };
