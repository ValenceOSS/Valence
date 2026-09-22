import { lockAsync, OrientationLock } from 'expo-screen-orientation';

/**
 * Turns this phone sideways, for the one screen that is worth turning it for.
 *
 * Forced rather than offered. Almost everything a household watches was shot wide, and a phone
 * held upright shows it as a strip across the middle with two thirds of the screen wasted — so
 * waiting to be asked means everybody asks, every time. Somebody who wants it the other way turns
 * the phone, which is the gesture they would have used anyway.
 */
const turnThisPhoneSideways = async (): Promise<void> => {
  await lockAsync(OrientationLock.LANDSCAPE).catch(() => undefined);
};

export { turnThisPhoneSideways };
