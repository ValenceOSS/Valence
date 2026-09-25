import { settleTheOrientation } from '@ValenceMobile/platform/settleTheOrientation';

/**
 * Turns this phone sideways, for the one screen that is worth turning it for, until that screen
 * lets go of it.
 *
 * Forced rather than offered. Almost everything a household watches was shot wide, and a phone
 * held upright shows it as a strip across the middle with two thirds of the screen wasted — so
 * waiting to be asked means everybody asks, every time. Somebody who wants it the other way turns
 * the phone, which is the gesture they would have used anyway.
 *
 * @returns What lets go of it again, which turns it back upright once nothing else wants it
 * sideways.
 */
const turnThisPhoneSideways = (): (() => void) => {
  void settleTheOrientation(1);

  return () => {
    void settleTheOrientation(-1);
  };
};

export { turnThisPhoneSideways };
