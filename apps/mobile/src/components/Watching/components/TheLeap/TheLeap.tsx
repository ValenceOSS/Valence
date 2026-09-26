import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { TheLeapProps } from './TheLeap.types';

const OVER_THE_PICTURE = '#ffffff';

const ARROWS = [0, 1, 2];

const COMING_IN = 220;

const HOLDING = 250;

const GOING = 300;

const DRIFTING_FROM = 12;

const SWEEPING = 900;

const styles = StyleSheet.create({
  arrows: { flexDirection: 'row', gap: 2 },
  back: { left: 0 },
  backwards: { transform: [{ scaleX: -1 }] },
  forward: { right: 0 },
  said: {
    color: OVER_THE_PICTURE,
    fontSize: 15,
    fontFamily: FONTS.sans.semibold,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 6,
  },
  shadowed: {
    shadowColor: '#000000',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  side: {
    alignItems: 'center',
    bottom: 0,
    gap: 8,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: '38%',
  },
});

/**
 * What a double tap on one side of the picture did, drawn on that side as YouTube draws it: arrows
 * running the way the film moved, and how far it has moved altogether.
 *
 * It eases in from the edge, is brought back up by every tap from wherever it had faded to, and
 * eases away once the taps stop, so a run of them reads as one leap growing rather than a flicker
 * for each.
 *
 * @param leap - Which way, how far altogether, and how many taps so far.
 */
const TheLeap = ({ leap }: TheLeapProps) => {
  const [showing] = useState(() => new Animated.Value(0));
  const [sweep] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const running = Animated.loop(
      Animated.timing(sweep, {
        toValue: ARROWS.length,
        duration: SWEEPING,
        easing: EASINGS.linear,
        useNativeDriver: true,
      }),
    );

    running.start();

    return () => {
      running.stop();
    };
  }, [sweep]);

  useEffect(() => {
    const coming = Animated.sequence([
      Animated.timing(showing, {
        toValue: 1,
        duration: COMING_IN,
        easing: EASINGS.outCubic,
        useNativeDriver: true,
      }),
      Animated.delay(HOLDING),
      Animated.timing(showing, {
        toValue: 0,
        duration: GOING,
        easing: EASINGS.inQuad,
        useNativeDriver: true,
      }),
    ]);

    coming.start();

    return () => {
      coming.stop();
    };
  }, [leap.count, showing]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.side,
        leap.way === 'back' ? styles.back : styles.forward,
        {
          opacity: showing,
          transform: [
            {
              translateX: showing.interpolate({
                inputRange: [0, 1],
                outputRange: [leap.way === 'back' ? -DRIFTING_FROM : DRIFTING_FROM, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.arrows, styles.shadowed, leap.way === 'back' && styles.backwards]}>
        {ARROWS.map((arrow) => (
          <Animated.View
            key={arrow}
            style={{
              opacity: sweep.interpolate({
                inputRange: [arrow, arrow + 0.5, arrow + 1],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              }),
            }}
          >
            <Icon of={PlayFilled} size={16} colour={OVER_THE_PICTURE} />
          </Animated.View>
        ))}
      </View>

      <Text style={styles.said}>{`${leap.seconds.toString()} seconds`}</Text>
    </Animated.View>
  );
};

TheLeap.displayName = 'TheLeap';

export { TheLeap };
