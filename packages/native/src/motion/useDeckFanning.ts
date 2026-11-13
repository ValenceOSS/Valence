import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { usePrefersStillness } from './usePrefersStillness';

const FANS_AFTER_MS = 250;

const STARTS_AT = 0.7;

const HOLDS_FANNED_MS = 1600;

const HOLDS_STACKED_MS = 350;

/**
 * Fans the deck of Valence's mark out, as the web's does: arriving, it grows into place from a
 * little smaller and a moment later the two cards behind spread out from under the front one;
 * looping, it holds fanned, gathers the cards back under the front one, and fans them out again, over
 * and over. Once it stops looping it fans out from wherever it had got to and stays. A deck that
 * does not arrive starts fanned out. For anybody who has asked for less motion it is simply there,
 * fanned out and full size.
 *
 * @param how - Whether the deck arrives, and whether it loops.
 * @returns How far the deck has fanned out, from 0 (stacked) to 1, and how large it is drawn, from
 *   0.7 to 1.
 */
const useDeckFanning = ({
  arrives = false,
  loops = false,
}: {
  arrives?: boolean;
  loops?: boolean;
}): { progress: number; grows: number } => {
  const isStill = usePrefersStillness();
  const isArriving = arrives && !isStill;
  const isLooping = loops && !isStill;
  const [fanned] = useState(() => new Animated.Value(isArriving ? 0 : 1));
  const [grown] = useState(() => new Animated.Value(isArriving ? STARTS_AT : 1));
  const [progress, setProgress] = useState(isArriving ? 0 : 1);
  const [grows, setGrows] = useState(isArriving ? STARTS_AT : 1);

  useEffect(() => {
    const fanning = fanned.addListener(({ value }) => {
      setProgress(value);
    });
    const growing = grown.addListener(({ value }) => {
      setGrows(value);
    });

    return () => {
      fanned.removeListener(fanning);
      grown.removeListener(growing);
    };
  }, [fanned, grown]);

  useEffect(() => {
    if (!isArriving) {
      grown.setValue(1);

      return undefined;
    }

    const growing = Animated.spring(grown, {
      toValue: 1,
      stiffness: 260,
      damping: 20,
      useNativeDriver: false,
    });

    growing.start();

    return () => {
      growing.stop();
    };
  }, [isArriving, grown]);

  useEffect(() => {
    if (isStill) {
      fanned.setValue(1);

      return undefined;
    }

    const fanOut = (after: number) =>
      Animated.sequence([
        Animated.delay(after),
        Animated.spring(fanned, {
          toValue: 1,
          stiffness: 140,
          damping: 15,
          useNativeDriver: false,
        }),
      ]);
    const gather = Animated.sequence([
      Animated.delay(HOLDS_FANNED_MS),
      Animated.spring(fanned, { toValue: 0, stiffness: 120, damping: 18, useNativeDriver: false }),
    ]);
    const motion = isLooping
      ? Animated.sequence([
          fanOut(isArriving ? FANS_AFTER_MS : 0),
          Animated.loop(Animated.sequence([gather, fanOut(HOLDS_STACKED_MS)])),
        ])
      : fanOut(isArriving ? FANS_AFTER_MS : 0);

    motion.start();

    return () => {
      motion.stop();
    };
  }, [isLooping, isArriving, isStill, fanned]);

  return { progress, grows };
};

export { useDeckFanning };
