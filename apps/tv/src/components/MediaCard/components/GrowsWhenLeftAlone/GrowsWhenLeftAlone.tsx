import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { HearsTheRemote } from '@ValenceTv/components/MediaCard/components/GrowsWhenLeftAlone/components/HearsTheRemote/HearsTheRemote';
import type { GrowsWhenLeftAloneProps } from './GrowsWhenLeftAlone.types';

const LEFT_ALONE_MS = 5000;

const GROWN = 1.08;

const GROWS_OVER_MS = 600;

const SHRINKS_OVER_MS = 180;

/**
 * Grows the card the remote has rested on, once nothing has been pressed for five seconds, and
 * brings it back to its size the moment anything is pressed or the remote moves on, after which it
 * waits another five seconds before growing again. The growing runs natively. A television that
 * keeps still never grows it.
 *
 * @param isFocused - Whether the remote is on the card.
 * @param children - The card.
 */
const GrowsWhenLeftAlone = ({ isFocused, children }: GrowsWhenLeftAloneProps) => {
  const isStill = useKeepsStill();
  const [size] = useState(() => new Animated.Value(1));
  const waiting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGrown = useRef(false);

  const settle = useCallback(() => {
    if (waiting.current !== null) {
      clearTimeout(waiting.current);
      waiting.current = null;
    }

    if (!isGrown.current) {
      return;
    }

    isGrown.current = false;
    Animated.timing(size, {
      toValue: 1,
      duration: SHRINKS_OVER_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [size]);

  const wait = useCallback(() => {
    settle();
    waiting.current = setTimeout(() => {
      waiting.current = null;
      isGrown.current = true;
      Animated.timing(size, {
        toValue: GROWN,
        duration: GROWS_OVER_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, LEFT_ALONE_MS);
  }, [settle, size]);

  const isWatching = isFocused && !isStill;

  useEffect(() => {
    if (!isWatching) {
      settle();

      return undefined;
    }

    wait();

    return settle;
  }, [isWatching, wait, settle]);

  return (
    <Animated.View style={{ transform: [{ scale: size }] }}>
      {isWatching ? <HearsTheRemote onHeard={wait} /> : null}
      {children}
    </Animated.View>
  );
};

GrowsWhenLeftAlone.displayName = 'GrowsWhenLeftAlone';

export { GrowsWhenLeftAlone };
