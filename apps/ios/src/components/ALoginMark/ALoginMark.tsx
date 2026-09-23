import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, useWindowDimensions, View } from 'react-native';
import { ACarriedMark } from '@ValencePhone/components/ACarriedMark/ACarriedMark';
import { useNotingTheMark } from '@ValencePhone/components/ACarriedMark/useNotingTheMark';
import { TheMark } from '@ValencePhone/components/TheMark/TheMark';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { SPRINGS } from '@ValencePhone/theme/SPRINGS';
import type { ALoginMarkProps } from './ALoginMark.types';

const AS_BIG_AS = 2.9;

const GROWS_FROM = 0.94;

const ARRIVES_OVER = 700;

/**
 * Valence's mark at the head of a screen on the way in, arriving as the web's does. The first time
 * the app shows one, it comes in large in the middle of the screen, fading and growing into view,
 * and a moment later springs up into its place while everything else rises in beneath it. Every
 * time after, it glides in from where the last screen had it, so from choosing a server to typing
 * a password it reads as one mark moving.
 *
 * Where it is going is measured rather than assumed, since that depends on what else is on the
 * screen, and it keeps to the middle of the screen if that changes while it is still there. Once
 * it has settled it glides after its place whenever the screen moves it, as the web's does, rather
 * than jumping.
 * Somebody who has asked for less motion sees it fade in in place.
 *
 * @param high - How tall it sits once it has settled.
 * @param isIntroducing - Whether it arrives, or is simply there.
 * @param settlesAfter - How long it stays in the middle, in milliseconds.
 */
const ALoginMark = ({ high, isIntroducing, settlesAfter }: ALoginMarkProps) => {
  const isStill = usePrefersStillness();
  const tall = useWindowDimensions().height;
  const placed = useRef<View | null>(null);
  const hasSettled = useRef(!isIntroducing);
  const slotAt = useRef<number | null>(null);
  const [showing] = useState(() => new Animated.Value(isIntroducing ? 0 : 1));
  const [size] = useState(() => new Animated.Value(isIntroducing ? AS_BIG_AS * GROWS_FROM : 1));
  const [lift] = useState(() => new Animated.Value(0));
  const isFlying = isIntroducing && !isStill;
  const note = useNotingTheMark();

  useEffect(() => {
    if (!isIntroducing) {
      return undefined;
    }

    if (isStill) {
      size.setValue(1);
      lift.setValue(0);
      hasSettled.current = true;
      Animated.timing(showing, {
        toValue: 1,
        duration: ARRIVES_OVER,
        useNativeDriver: true,
      }).start();

      return undefined;
    }

    Animated.parallel([
      Animated.timing(showing, {
        toValue: 1,
        duration: ARRIVES_OVER,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(size, {
        toValue: AS_BIG_AS,
        duration: ARRIVES_OVER,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const settling = setTimeout(() => {
      hasSettled.current = true;
      Animated.parallel([
        Animated.spring(size, { toValue: 1, ...SPRINGS.liquid, useNativeDriver: true }),
        Animated.spring(lift, { toValue: 0, ...SPRINGS.liquid, useNativeDriver: true }),
      ]).start();
    }, settlesAfter);

    return () => {
      clearTimeout(settling);
    };
  }, [isIntroducing, isStill, settlesAfter, showing, size, lift]);

  if (!isIntroducing) {
    return <ACarriedMark high={high} />;
  }

  return (
    <View
      ref={placed}
      collapsable={false}
      onLayout={() => {
        note(placed.current);

        placed.current?.measureInWindow((_, y, __, height) => {
          const was = slotAt.current;

          slotAt.current = y;

          if (!hasSettled.current) {
            if (isFlying) {
              lift.setValue(tall / 2 - (y + height / 2));
            }

            return;
          }

          if (was === null || isStill || Math.abs(was - y) < 0.5) {
            return;
          }

          lift.setValue(was - y);
          Animated.spring(lift, { toValue: 0, ...SPRINGS.liquid, useNativeDriver: true }).start();
        });
      }}
    >
      <Animated.View
        style={{ opacity: showing, transform: [{ translateY: lift }, { scale: size }] }}
      >
        <TheMark high={high} />
      </Animated.View>
    </View>
  );
};

ALoginMark.displayName = 'ALoginMark';

export { ALoginMark };
