import { Dimensions } from 'react-native';
import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { sideStripOf } from '@ValenceMobile/platform/sideStripOf';

const ROOMY_FROM = 600;

let askingForSideways = 0;

let settling = Promise.resolve();

let isWatchingTheWindow = false;

/**
 * Whether this phone is to be held however it comes rather than read upright: a folding phone,
 * folded or opened out, which the system turns with the hand and resizes the app to fit, or any
 * screen big enough both ways.
 *
 * A folding phone is known by the strip down one side of its screen. It asks the window rather than
 * the screen for its size, since a folding phone's screen reports the size it was built for, not
 * the size the app is drawn at.
 */
const isRoomy = (): boolean => {
  const { width, height } = Dimensions.get('window');
  const isFolding =
    initialWindowMetrics !== null && sideStripOf(initialWindowMetrics.insets) !== null;

  return isFolding || Math.min(width, height) >= ROOMY_FROM;
};

/**
 * Turns this phone the way what is on screen wants it: sideways while anything showing a film has
 * asked for that, and upright otherwise — or however it is held on a folding phone or a screen
 * roomy enough both ways, where locking it would draw everything on its side once it is folded or
 * opened.
 *
 * Asks are counted rather than obeyed as they arrive, and each turn waits for the one before it.
 * A screen that lets go of the phone and takes it again at once — as React does when it runs an
 * effect over — sends two turns that would otherwise race, and whichever the system finished last
 * would win, often the wrong one. The window is watched from the first turn on, so folding or
 * opening the phone settles it again.
 *
 * @param by - How many more asks for sideways there are: one as a film opens, minus one as it
 * closes, none to put the phone back the way it should already be.
 * @returns Once the phone has been turned.
 */
const settleTheOrientation = (by: number): Promise<void> => {
  askingForSideways = Math.max(askingForSideways + by, 0);

  if (!isWatchingTheWindow) {
    isWatchingTheWindow = true;
    Dimensions.addEventListener('change', () => {
      void settleTheOrientation(0);
    });
  }

  settling = settling
    .then(() =>
      lockAsync(
        isRoomy()
          ? OrientationLock.DEFAULT
          : askingForSideways > 0
            ? OrientationLock.LANDSCAPE
            : OrientationLock.PORTRAIT_UP,
      ),
    )
    .catch(() => undefined);

  return settling;
};

export { settleTheOrientation };
