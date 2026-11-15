import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { usePrefersStillness } from './usePrefersStillness';

const DROPS_AFTER_MS = [0, 130, 240] as const;

const HOLDS_STACKED_MS = 1300;

const LIFTS_MS = 360;

const RESTS_EMPTY_MS = 220;

/**
 * How far each of the mark's three layers has dropped into place, base first: the base lands, then
 * the middle, then the top, each settling with a little give; looping, the stack holds and lifts
 * away top first, the way it came in played backwards, and stacks again. Once it has stacked, a
 * loop that stops settles the layers where they belong rather than dropping them in again. Whoever
 * asked for stillness gets the mark already stacked.
 *
 * @param arrives - Whether the layers drop in when the mark first appears.
 * @param loops - Whether they go on stacking and lifting away, for a screen that waits.
 * @returns One value per layer, base first, from 0 (lifted away) to 1 (in place).
 */
const useLayersStacking = ({
  arrives = false,
  loops = false,
}: {
  arrives?: boolean;
  loops?: boolean;
}): readonly Animated.Value[] => {
  const isStill = usePrefersStillness();
  const isMoving = (arrives || loops) && !isStill;
  const [layers] = useState(() => DROPS_AFTER_MS.map(() => new Animated.Value(isMoving ? 0 : 1)));
  const hasStacked = useRef(false);

  useEffect(() => {
    if (hasStacked.current && !loops) {
      const settle = Animated.parallel(
        layers.map((layer) =>
          Animated.spring(layer, {
            toValue: 1,
            stiffness: 260,
            damping: 16,
            useNativeDriver: true,
          }),
        ),
      );

      settle.start();

      return () => {
        settle.stop();
      };
    }

    if (!isMoving) {
      layers.forEach((layer) => {
        layer.setValue(1);
      });

      return undefined;
    }

    const stackIn = Animated.parallel(
      layers.map((layer, at) =>
        Animated.sequence([
          Animated.delay(DROPS_AFTER_MS[at] ?? 0),
          Animated.spring(layer, {
            toValue: 1,
            stiffness: 260,
            damping: 16,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    const liftAway = Animated.parallel(
      layers.map((layer, at) =>
        Animated.sequence([
          Animated.delay(DROPS_AFTER_MS[DROPS_AFTER_MS.length - 1 - at] ?? 0),
          Animated.timing(layer, {
            toValue: 0,
            duration: LIFTS_MS,
            easing: Easing.bezier(0.32, 0, 0.67, 0),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    const run = loops
      ? Animated.loop(
          Animated.sequence([
            stackIn,
            Animated.delay(HOLDS_STACKED_MS),
            liftAway,
            Animated.delay(RESTS_EMPTY_MS),
          ]),
        )
      : stackIn;

    layers.forEach((layer) => {
      layer.setValue(0);
    });
    hasStacked.current = true;
    run.start();

    return () => {
      run.stop();
    };
  }, [isMoving, loops, layers]);

  return layers;
};

export { useLayersStacking };
