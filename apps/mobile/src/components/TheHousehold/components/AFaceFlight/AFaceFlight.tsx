import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { AFaceFlightProps } from './AFaceFlight.types';

const LIFTS_BY = 18;

const LIFTS_TO = 1.06;

const LIFTS_OVER = 360;

const ROUNDNESS = 0.06;

const GIVES_UP_AFTER = 4000;

const FADES_OVER = 180;

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  flying: { position: 'absolute' },
  initial: { color: '#ffffff', fontFamily: FONTS.sans.bold, fontSize: 38 },
});

/**
 * Somebody's face on its way from the password to the account tab once they are in: lifted off
 * the screen, rounded into the circle the tab draws, and then sprung down into the tab's place,
 * where the tab's own face takes over from it in the same moment. It waits in the air until the tab says where it is, and
 * gives up and fades if it never does.
 *
 * @param profile - Whose face.
 * @param from - Where it was on the password screen.
 * @param to - Where the tab shows it, once that is known.
 * @param onLanded - Told once it has landed and faded, or given up.
 */
const AFaceFlight = ({ profile, from, to, onLanded }: AFaceFlightProps) => {
  const [moved] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [grown] = useState(() => new Animated.Value(1));
  const [round] = useState(() => new Animated.Value(Math.round(from.width * ROUNDNESS)));
  const [seen] = useState(() => new Animated.Value(1));
  const [isLifted, setIsLifted] = useState(false);
  const [missing, setMissing] = useState(false);
  const picture = thePictureFor(profile);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(moved.y, {
        toValue: -LIFTS_BY,
        duration: LIFTS_OVER,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(grown, {
        toValue: LIFTS_TO,
        duration: LIFTS_OVER,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    Animated.timing(round, {
      toValue: from.width / 2,
      duration: LIFTS_OVER,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const lifting = setTimeout(() => {
      setIsLifted(true);
    }, LIFTS_OVER);

    return () => {
      clearTimeout(lifting);
    };
  }, [moved, grown, round, from.width]);

  useEffect(() => {
    if (!isLifted) {
      return undefined;
    }

    const fadeAway = () => {
      Animated.timing(seen, { toValue: 0, duration: FADES_OVER, useNativeDriver: true }).start();
      setTimeout(onLanded, FADES_OVER);
    };

    if (to === null) {
      const givingUp = setTimeout(fadeAway, GIVES_UP_AFTER);

      return () => {
        clearTimeout(givingUp);
      };
    }

    Animated.parallel([
      Animated.spring(moved, {
        toValue: {
          x: to.x + to.width / 2 - (from.x + from.width / 2),
          y: to.y + to.height / 2 - (from.y + from.height / 2),
        },
        friction: 6,
        tension: 48,
        useNativeDriver: true,
      }),
      Animated.spring(grown, {
        toValue: to.width / from.width,
        friction: 6,
        tension: 48,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onLanded();
      }
    });

    return undefined;
  }, [isLifted, to, from, moved, grown, seen, onLanded]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flying,
        {
          height: from.height,
          left: from.x,
          opacity: seen,
          top: from.y,
          transform: [{ translateX: moved.x }, { translateY: moved.y }, { scale: grown }],
          width: from.width,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.face,
          {
            backgroundColor:
              picture?.isDrawn === false && !missing ? 'transparent' : profile.colour,
            borderRadius: round,
          },
        ]}
      >
        {picture === null || missing ? (
          <Text style={styles.initial}>{profileInitial(profile.name)}</Text>
        ) : (
          <APicture
            picture={picture}
            onMissing={() => {
              setMissing(true);
            }}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
};

AFaceFlight.displayName = 'AFaceFlight';

export { AFaceFlight };
