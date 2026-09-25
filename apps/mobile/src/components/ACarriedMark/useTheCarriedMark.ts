import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useArrivingFrom } from '@ValenceMobile/hooks/useArrivingFrom';
import { THE_MARKS_PLACE } from '@ValenceMobile/components/ACarriedMark/THE_MARKS_PLACE';
import { useNotingTheMark } from '@ValenceMobile/components/ACarriedMark/useNotingTheMark';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';

/**
 * Keeps Valence's mark in one place on the screen from one screen to the next, as the web keeps a
 * single mark that glides wherever the page puts it.
 *
 * The phone draws a mark on each screen, so this is how they agree: this screen's mark stays
 * hidden while the mark flying above everything — left where the last screen's mark was — glides
 * to its place, and shows itself once that mark has arrived. Where nothing is flying, it is simply
 * there. Once it is, it glides after its place whenever this screen moves it.
 *
 * Its place is read the moment the screen is laid out rather than asked for afterwards, since a
 * screen as heavy as the library answers late, and the flying mark would sit waiting in the middle
 * of it for the answer.
 *
 * @param isHandedOn - Whether this screen's mark goes on to the next screen when this one goes.
 * @returns What to hold the still view the mark sits in, what to call once that is laid out, how
 *   visible the mark is, and the movement to give it.
 */
const useTheCarriedMark = (isHandedOn = true) => {
  const way = useContext(THE_MARKS_PLACE);
  const note = useNotingTheMark(isHandedOn);
  const following = useArrivingFrom(() => null, false, false, true);
  const hasLanded = useRef(false);
  const [shown] = useState(() => new Animated.Value(0));

  const landAt = (at: ARectOnScreen) => {
    if (hasLanded.current) {
      return;
    }

    hasLanded.current = true;

    if (
      !way.land(at, () => {
        shown.setValue(1);
      })
    ) {
      shown.setValue(1);
    }
  };

  useLayoutEffect(() => {
    const box = following.placed.current?.getBoundingClientRect();

    if (box !== undefined && box.width > 0) {
      landAt({ x: box.x, y: box.y, width: box.width, height: box.height });
    }
  });

  return {
    placed: following.placed,
    shown,
    following: following.flying,
    onPlaced: () => {
      following.onPlaced();
      note(following.placed.current);

      if (!hasLanded.current) {
        following.placed.current?.measureInWindow((x, y, width, height) => {
          landAt({ x, y, width, height });
        });
      }
    },
  };
};

export { useTheCarriedMark };
