import { lockAsync, OrientationLock } from 'expo-screen-orientation';

let askingForSideways = 0;

let settling = Promise.resolve();

/**
 * Turns this phone the way what is on screen wants it: sideways while anything showing a film has
 * asked for that, and upright otherwise.
 *
 * Asks are counted rather than obeyed as they arrive, and each turn waits for the one before it.
 * A screen that lets go of the phone and takes it again at once — as React does when it runs an
 * effect over — sends two turns that would otherwise race, and whichever the system finished last
 * would win, often the wrong one.
 *
 * @param by - How many more asks for sideways there are: one as a film opens, minus one as it
 * closes, none to put the phone back the way it should already be.
 * @returns Once the phone has been turned.
 */
const settleTheOrientation = (by: number): Promise<void> => {
  askingForSideways = Math.max(askingForSideways + by, 0);
  settling = settling
    .then(() =>
      lockAsync(askingForSideways > 0 ? OrientationLock.LANDSCAPE : OrientationLock.PORTRAIT_UP),
    )
    .catch(() => undefined);

  return settling;
};

export { settleTheOrientation };
