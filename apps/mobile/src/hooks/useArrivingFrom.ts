import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import type { ARectOnScreen } from './useArrivingFrom.types';

/**
 * Carries something across from where it was on the screen before, as the web carries a face from
 * the wall to the password and back, and its mark from the way in to the corner of the library: it
 * is measured where it has landed, drawn over where it came from at the size it was there, and
 * sprung into its place.
 *
 * Where it came from is asked for only once it has landed, since the screen it came from may still
 * be leaving as this one is drawn. Where there is nowhere, or somebody has asked for less motion,
 * it is simply where it belongs. Until it has been measured it is hidden, so it never shows for a
 * frame in the wrong place.
 *
 * @param whence - Where it was, and how big, on the screen before, asked once it has landed.
 * @param mayArrive - Whether it may be arriving from somewhere at all, and so starts hidden.
 * @param isSquareAtTop - Whether only a square at the top of it moves, as a face over its name,
 *   so its size is measured from its width alone.
 * @param followsItsPlace - Whether, once it has landed, it glides after its place whenever the
 *   screen moves that — as the web's mark does when a list appears beneath it — rather than
 *   jumping there.
 * @returns What to hold the still view it lands in, what to call once that is laid out, and the
 *   movement to give the view inside it.
 */
const useArrivingFrom = (
  whence: () => ARectOnScreen | null,
  mayArrive: boolean,
  isSquareAtTop = false,
  followsItsPlace = false,
): {
  placed: RefObject<ComponentRef<typeof View> | null>;
  onPlaced: () => void;
  flying: {
    opacity: Animated.Value;
    transform: [
      { translateX: Animated.Value },
      { translateY: Animated.Value },
      { scale: Animated.Value },
    ];
  };
} => {
  const isStill = usePrefersStillness();
  const placed = useRef<ComponentRef<typeof View> | null>(null);
  const hasLanded = useRef(false);
  const lastAt = useRef<ARectOnScreen | null>(null);
  const [shown] = useState(() => new Animated.Value(mayArrive ? 0 : 1));
  const [across] = useState(() => new Animated.Value(0));
  const [down] = useState(() => new Animated.Value(0));
  const [size] = useState(() => new Animated.Value(1));

  const glide = () => {
    Animated.parallel([
      Animated.spring(across, { toValue: 0, ...SPRINGS.liquid, useNativeDriver: true }),
      Animated.spring(down, { toValue: 0, ...SPRINGS.liquid, useNativeDriver: true }),
      Animated.spring(size, { toValue: 1, ...SPRINGS.liquid, useNativeDriver: true }),
    ]).start();
  };

  const onPlaced = () => {
    if (!mayArrive && !followsItsPlace) {
      return;
    }

    const isLanding = !hasLanded.current;
    const from = isLanding && mayArrive ? whence() : null;

    hasLanded.current = true;

    placed.current?.measureInWindow((x, y, width, measuredHeight) => {
      const height = isSquareAtTop ? width : measuredHeight;
      const was = isLanding ? from : lastAt.current;

      lastAt.current = { x, y, width, height };
      shown.setValue(1);

      if (was === null || isStill || width === 0) {
        return;
      }

      const acrossBy = was.x + was.width / 2 - (x + width / 2);
      const downBy = was.y + was.height / 2 - (y + height / 2);

      if (!isLanding && Math.abs(acrossBy) < 0.5 && Math.abs(downBy) < 0.5) {
        return;
      }

      across.setValue(acrossBy);
      down.setValue(downBy);
      size.setValue(was.width / width);
      glide();
    });
  };

  return {
    placed,
    onPlaced,
    flying: {
      opacity: shown,
      transform: [{ translateX: across }, { translateY: down }, { scale: size }],
    },
  };
};

export { useArrivingFrom };
