import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import type { FlightProps } from './Flight.types';

const FLIES_MS = 450;

const GIVES_UP_MS = 1500;

/**
 * Something flying from where it was to where it belongs on the next screen, as the web and the
 * desktop app move somebody's face and Valence's mark between the screens of the way in: from the
 * row of faces onto the PIN screen, and from there, once they are in, up into the bar. It is drawn
 * over everything, at the size and place it
 * starts from, and moved and grown or shrunk into the place it is going on the native driver, so it
 * never waits on JavaScript mid-flight. Where it is going is not known until the next screen has
 * been laid out, so it waits where it is until then — and gives up after a moment where nowhere is
 * ever said, rather than hang over the screen.
 *
 * @param from - Where it starts.
 * @param to - Where it lands, once that is known.
 * @param onLanded - Told when it has arrived, so what is waiting there can show itself.
 * @param children - What flies, drawn at the size it starts from.
 */
const Flight = ({ from, to, onLanded, children }: FlightProps) => {
  const flown = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (to === null) {
      const givingUp = setTimeout(onLanded, GIVES_UP_MS);

      return () => {
        clearTimeout(givingUp);
      };
    }

    Animated.timing(flown, {
      toValue: 1,
      duration: FLIES_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onLanded();
    });
  }, [to, flown, onLanded]);

  const across = to === null ? 0 : to.x + to.width / 2 - (from.x + from.width / 2);
  const down = to === null ? 0 : to.y + to.height / 2 - (from.y + from.height / 2);
  const grows = to === null ? 1 : to.width / from.width;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flying,
        {
          left: from.x,
          top: from.y,
          transform: [
            { translateX: flown.interpolate({ inputRange: [0, 1], outputRange: [0, across] }) },
            { translateY: flown.interpolate({ inputRange: [0, 1], outputRange: [0, down] }) },
            { scale: flown.interpolate({ inputRange: [0, 1], outputRange: [1, grows] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

Flight.displayName = 'Flight';

const styles = StyleSheet.create({
  flying: { position: 'absolute' },
});

export { Flight };
