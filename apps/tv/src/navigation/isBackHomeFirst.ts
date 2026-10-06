import { Platform } from 'react-native';
import type { Tab } from '@ValenceTv/navigation/Tab';

/**
 * Whether Back on a part of the bar goes to Home before it leaves the app, as Android TV apps do;
 * on an Apple TV, Menu leaves from any part, as Apple's own apps do.
 *
 * @param tab - The part of the bar showing.
 * @param system - Which system it runs, which is this television's own unless a test says otherwise.
 * @returns Whether Back goes Home.
 */
const isBackHomeFirst = (tab: Tab, system: typeof Platform.OS = Platform.OS): boolean =>
  system === 'android' && tab !== 'home';

export { isBackHomeFirst };
