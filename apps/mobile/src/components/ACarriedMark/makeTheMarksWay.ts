import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';
import type { AFlyer, TheMarksWay } from './THE_MARKS_PLACE.types';

/**
 * Where Valence's mark is on its way between screens: whether one has been shown since the app
 * opened, and the mark flying above everything that a screen hands its mark to as it goes and
 * takes it back from as it arrives.
 *
 * While the splash holds the mark, a screen whose mark finds its place waits for it, hidden, and
 * nothing leaves; once the splash lets go, its mark flies from where it was to the last place
 * found, as the web's splash hands its mark on to the bar along the top.
 *
 * @returns The way, with nothing flying yet.
 */
const makeTheMarksWay = (): TheMarksWay => {
  let isShown = false;
  let flyer: AFlyer | null = null;
  let isHeld = false;
  let waiting: { at: ARectOnScreen; whenThere: () => void } | null = null;

  return {
    hasShown: () => isShown,
    markShown: () => {
      isShown = true;
    },
    leave: (at) => {
      if (!isHeld) {
        flyer?.leave(at);
      }
    },
    land: (at, whenThere) => {
      if (isHeld) {
        waiting = { at, whenThere };

        return true;
      }

      return flyer?.land(at, whenThere) ?? false;
    },
    flyWith: (next) => {
      flyer = next;
    },
    hold: () => {
      isHeld = true;
      isShown = true;
    },
    release: (from) => {
      const landing = waiting;

      isHeld = false;
      waiting = null;

      if (landing === null) {
        return;
      }

      flyer?.leave(from);

      if (!(flyer?.land(landing.at, landing.whenThere) ?? false)) {
        landing.whenThere();
      }
    },
  };
};

export { makeTheMarksWay };
