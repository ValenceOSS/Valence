import { Platform } from 'react-native';

/**
 * Whether this phone has the Swift views the app draws glass, blur, fades and AirPlay with, which
 * only an iPhone does. Anywhere else those are drawn plainly instead.
 *
 * @returns Whether it does.
 */
const drawsNatively = (): boolean => Platform.OS === 'ios';

export { drawsNatively };
