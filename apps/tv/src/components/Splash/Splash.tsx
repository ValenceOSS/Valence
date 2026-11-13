import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { DeckMark } from '@ValenceTv/components/DeckMark/DeckMark';
import { LoadingBar } from '@ValenceTv/components/LoadingBar/LoadingBar';
import type { SplashProps } from './Splash.types';
import { say } from '@ValenceI18n/say';

const MARK = { width: 160, height: 117 };

const NAME_OPENS_MS = 420;

const NAME_HOLDS_MS = 700;

const LEAVES_MS = 520;

const BAR_FROM_THE_FOOT = 96;

const BAR_DIMS_TO = 0.4;

const EASES_OUT = Easing.out((t) => Easing.cubic(t));

const EASES_IN = Easing.in((t) => Easing.cubic(t));

/**
 * What Valence shows as it opens, taking over from the television's launch screen without a seam:
 * the same mark, at the same size and in the same place, on the same dark ground. While the app
 * finds out who is signed in the deck gathers its cards back up and fans them out again, over and
 * over, with a slim bar at the foot of the screen sliding along. Once it knows, the bar fades, the
 * deck fans out and stays, the name opens out beside it and holds a moment, and then the mark
 * swells and fades and the ground fades with it, uncovering the first screen beneath.
 *
 * @param isDone - Whether the app is ready to show its first screen.
 * @param onGone - Told once it has faded away, so it can be taken off the screen.
 */
const Splash = ({ isDone, onGone }: SplashProps) => {
  const [named] = useState(() => new Animated.Value(0));
  const [leaving] = useState(() => new Animated.Value(0));
  const [barShown] = useState(() => new Animated.Value(BAR_DIMS_TO));
  const isStill = useKeepsStill();

  useEffect(() => {
    if (!isDone) {
      return;
    }

    if (isStill) {
      onGone();

      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(named, {
          toValue: 1,
          duration: NAME_OPENS_MS,
          easing: EASES_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(barShown, {
          toValue: 0,
          duration: NAME_OPENS_MS,
          easing: EASES_OUT,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(NAME_HOLDS_MS),
      Animated.timing(leaving, {
        toValue: 1,
        duration: LEAVES_MS,
        easing: EASES_IN,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onGone();
    });
  }, [isDone, isStill, named, barShown, leaving, onGone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.ground,
        { opacity: leaving.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}
    >
      <Animated.View
        style={[
          MARK,
          {
            transform: [
              { scale: leaving.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) },
            ],
          },
        ]}
      >
        <DeckMark
          width={MARK.width}
          height={MARK.height}
          loops={!isDone && !isStill}
          label={say('common.valence')}
        />

        <Animated.View
          style={[
            styles.name,
            {
              opacity: named,
              transform: [
                { translateX: named.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.word}>{say('common.valence')}</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.bar, { opacity: barShown }]}>
        <LoadingBar isStill={isStill} />
      </Animated.View>
    </Animated.View>
  );
};

Splash.displayName = 'Splash';

const styles = StyleSheet.create({
  ground: {
    backgroundColor: tokens.colours.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    position: 'absolute',
    left: MARK.width + 28,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  word: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '600',
    letterSpacing: tokens.type.hero * -0.03,
  },
  bar: { position: 'absolute', bottom: BAR_FROM_THE_FOOT, alignItems: 'center' },
});

export { Splash };
