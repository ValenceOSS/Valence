import { settleTheOrientation } from '@ValenceMobile/platform/settleTheOrientation';

/**
 * Keeps this phone the way up somebody is holding it while they look around, unless a film on
 * screen has turned it sideways.
 *
 * A wall of faces and a shelf of posters are laid out down the screen, and turning the phone
 * sideways gives a wider, shorter version of the same thing that nobody asked for. A film is the
 * one thing here worth turning a phone for — see {@link turnThisPhoneSideways}.
 *
 * @returns Once the phone has been turned.
 */
const holdThisPhoneUpright = (): Promise<void> => settleTheOrientation(0);

export { holdThisPhoneUpright };
