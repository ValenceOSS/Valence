import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { THE_MARKS_PLACE } from '@ValenceMobile/components/ACarriedMark/THE_MARKS_PLACE';
import { TheMark } from '@ValenceMobile/components/TheMark/TheMark';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';

const GLIDES_OVER = 400;

const WAITS_AT_MOST = 3000;

const FADES_OVER = 250;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  mark: { position: 'absolute' },
});

/**
 * The one Valence mark that moves between screens, drawn above everything, as the web draws one
 * mark that glides wherever the page puts it.
 *
 * When a screen with a mark goes, this takes the mark's place at once, so there is never a moment
 * without one while the next screen is being drawn — which, for the library after signing in, is
 * long enough to see. When the next screen's mark has found its place, this glides there and hands
 * over, setting off at once and settling quickly, so it keeps up with the screen changing around
 * it rather than trailing behind. A mark nobody takes up within a few seconds fades away.
 */
const TheFlyingMark = () => {
  const way = useContext(THE_MARKS_PLACE);
  const isStill = usePrefersStillness();
  const [at, setAt] = useState<ARectOnScreen | null>(null);
  const [goingTo, setGoingTo] = useState<ARectOnScreen | null>(null);
  const held = useRef<{ at: ARectOnScreen; since: number } | null>(null);
  const whenThere = useRef<(() => void) | null>(null);
  const [across] = useState(() => new Animated.Value(0));
  const [down] = useState(() => new Animated.Value(0));
  const [size] = useState(() => new Animated.Value(1));
  const [shown] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let forgetting: ReturnType<typeof setTimeout> | null = null;

    const leave = (leftAt: ARectOnScreen) => {
      whenThere.current?.();
      whenThere.current = null;
      held.current = { at: leftAt, since: Date.now() };
      shown.setValue(1);
      setGoingTo(null);
      setAt(leftAt);

      if (forgetting !== null) {
        clearTimeout(forgetting);
      }

      forgetting = setTimeout(() => {
        if (held.current !== null) {
          held.current = null;
          Animated.timing(shown, {
            toValue: 0,
            duration: FADES_OVER,
            useNativeDriver: true,
          }).start(() => {
            setAt(null);
          });
        }
      }, WAITS_AT_MOST);
    };

    const land = (to: ARectOnScreen, arrived: () => void): boolean => {
      const from = held.current;

      held.current = null;

      if (from === null || Date.now() - from.since > WAITS_AT_MOST || isStill) {
        setAt(null);

        return false;
      }

      whenThere.current = arrived;
      across.setValue(from.at.x + from.at.width / 2 - (to.x + to.width / 2));
      down.setValue(from.at.y + from.at.height / 2 - (to.y + to.height / 2));
      size.setValue(from.at.width / to.width);
      setAt(null);
      setGoingTo(to);

      return true;
    };

    way.flyWith({ leave, land });

    return () => {
      way.flyWith(null);

      if (forgetting !== null) {
        clearTimeout(forgetting);
      }
    };
  }, [way, isStill, across, down, size, shown]);

  useEffect(() => {
    if (goingTo === null) {
      return undefined;
    }

    const gliding = Animated.parallel(
      [across, down, size].map((value, index) =>
        Animated.timing(value, {
          toValue: index === 2 ? 1 : 0,
          duration: GLIDES_OVER,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );

    gliding.start(({ finished }) => {
      if (finished) {
        whenThere.current?.();
        whenThere.current = null;
        setGoingTo(null);
      }
    });

    return () => {
      gliding.stop();
    };
  }, [goingTo, across, down, size]);

  const box = goingTo ?? at;

  if (box === null) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.fills}>
      <Animated.View
        style={[
          styles.mark,
          {
            left: box.x,
            opacity: shown,
            top: box.y,
            transform:
              goingTo === null
                ? []
                : [{ translateX: across }, { translateY: down }, { scale: size }],
          },
        ]}
      >
        <TheMark high={box.height} />
      </Animated.View>
    </View>
  );
};

TheFlyingMark.displayName = 'TheFlyingMark';

export { TheFlyingMark };
