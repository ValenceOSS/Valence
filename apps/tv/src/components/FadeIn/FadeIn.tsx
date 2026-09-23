import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { FadeInProps } from './FadeIn.types';

const ARRIVES_MS = 320;

const RISES_BY = 24;

const STARTS_AT = 0.1;

/**
 * Brings a page in rather than cutting to it: it fades up and settles into place, so moving between
 * pages reads as going somewhere.
 *
 * It starts all but invisible rather than invisible: on a television, a list whose rows are brought in
 * from nothing at all can send the remote back to where it came from.
 *
 * @param children - The page.
 * @param isFilling - Whether it fills the space it is in, as a page does, rather than taking only the
 *   room its content needs.
 * @param isShown - Whether it is showing; a page kept while hidden fades in again each time it is shown.
 * @param delayMs - How long to wait before fading in, so a row of things can arrive one after another.
 */
const FadeIn = ({ children, isFilling = true, isShown = true, delayMs = 0 }: FadeInProps) => {
  const shown = useRef(new Animated.Value(STARTS_AT)).current;

  useEffect(() => {
    if (!isShown) {
      return;
    }

    shown.setValue(STARTS_AT);
    Animated.timing(shown, {
      toValue: 1,
      duration: ARRIVES_MS,
      delay: delayMs,
      useNativeDriver: true,
    }).start();
  }, [shown, isShown, delayMs]);

  return (
    <Animated.View
      style={[
        isFilling && styles.page,
        {
          opacity: shown,
          transform: [
            {
              translateY: shown.interpolate({
                inputRange: [STARTS_AT, 1],
                outputRange: [RISES_BY, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

FadeIn.displayName = 'FadeIn';

const styles = StyleSheet.create({
  page: { flex: 1 },
});

export { FadeIn };
