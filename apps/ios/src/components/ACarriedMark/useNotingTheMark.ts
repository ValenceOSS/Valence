import { useContext, useLayoutEffect, useRef } from 'react';
import { THE_MARKS_PLACE } from '@ValencePhone/components/ACarriedMark/THE_MARKS_PLACE';
import type { View } from 'react-native';
import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';

/**
 * Notes where this screen's Valence mark sits, and hands that place to the mark flying above
 * everything as the screen goes, so the mark stays on screen while the next screen is drawn and
 * glides from there to wherever the next screen puts it.
 *
 * @param isHandedOn - Whether the mark goes on to the next screen at all, which it does between
 *   the screens of the way in and not from the library, whose next screen has no mark to take it.
 * @returns What to call with the still view the mark sits in, once that is laid out.
 */
const useNotingTheMark = (isHandedOn = true): ((placed: View | null) => void) => {
  const way = useContext(THE_MARKS_PLACE);
  const sitsAt = useRef<ARectOnScreen | null>(null);

  useLayoutEffect(
    () => () => {
      if (isHandedOn && sitsAt.current !== null) {
        way.leave(sitsAt.current);
      }
    },
    [way, isHandedOn],
  );

  return (placed) => {
    placed?.measureInWindow((x, y, width, height) => {
      sitsAt.current = { x, y, width, height };
      way.markShown();
    });
  };
};

export { useNotingTheMark };
