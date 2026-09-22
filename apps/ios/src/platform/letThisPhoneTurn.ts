import { lockAsync, OrientationLock } from 'expo-screen-orientation';

/**
 * Lets this phone be turned, for the one screen that is worth turning it for.
 *
 * Allowed rather than forced: a film shot wide is better sideways and somebody lying down is not,
 * and deciding for them which of those is happening gets it wrong half the time.
 */
const letThisPhoneTurn = async (): Promise<void> => {
  await lockAsync(OrientationLock.ALL).catch(() => undefined);
};

export { letThisPhoneTurn };
