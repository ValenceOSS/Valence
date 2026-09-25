import type { AFlyer, TheMarksWay } from './THE_MARKS_PLACE.types';

/**
 * Where Valence's mark is on its way between screens: whether one has been shown since the app
 * opened, and the mark flying above everything that a screen hands its mark to as it goes and
 * takes it back from as it arrives.
 *
 * @returns The way, with nothing flying yet.
 */
const makeTheMarksWay = (): TheMarksWay => {
  let isShown = false;
  let flyer: AFlyer | null = null;

  return {
    hasShown: () => isShown,
    markShown: () => {
      isShown = true;
    },
    leave: (at) => {
      flyer?.leave(at);
    },
    land: (at, whenThere) => flyer?.land(at, whenThere) ?? false,
    flyWith: (next) => {
      flyer = next;
    },
  };
};

export { makeTheMarksWay };
