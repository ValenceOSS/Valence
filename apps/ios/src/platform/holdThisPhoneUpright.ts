import { lockAsync, OrientationLock } from 'expo-screen-orientation';

/**
 * Keeps this phone the way up somebody is holding it while they look around.
 *
 * A wall of faces and a shelf of posters are laid out down the screen, and turning the phone
 * sideways gives a wider, shorter version of the same thing that nobody asked for. A film is the
 * one thing here worth turning a phone for — see {@link letThisPhoneTurn}.
 */
const holdThisPhoneUpright = async (): Promise<void> => {
  await lockAsync(OrientationLock.PORTRAIT_UP).catch(() => undefined);
};

export { holdThisPhoneUpright };
