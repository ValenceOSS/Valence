import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { FadeInProps } from './FadeIn.types';

const ARRIVES_MS = 320;

const RISES_BY = 24;

/**
 * Brings a page in rather than cutting to it: it fades up and settles into place, so moving between
 * pages reads as going somewhere.
 *
 * @param children - The page.
 */
const FadeIn = ({ children }: FadeInProps) => {
  const shown = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(shown, { toValue: 1, duration: ARRIVES_MS, useNativeDriver: true }).start();
  }, [shown]);

  return (
    <Animated.View
      style={[
        styles.page,
        {
          opacity: shown,
          transform: [
            { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [RISES_BY, 0] }) },
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
