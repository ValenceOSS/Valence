import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { AFaceFlightProps } from './AFaceFlight.types';
import { backdropOfAFace } from '@ValenceMobile/components/AFace/backdropOfAFace';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';

const LIFTS_BY = 18;

const LIFTS_TO = 1.06;

const LIFTS_OVER = 360;

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
 * Somebody's face on its way from the password once they are in: lifted off the screen and then
 * sprung down into the account tab's place, or onto their face where the phone first asks who is
 * watching, where the face drawn there takes over from it in the same moment. It waits in the air
 * until it is told where to land, and gives up and fades if it never is.
 *
 * @param profile - Whose face.
 * @param from - Where it was on the password screen.
 * @param to - Where the tab shows it, once that is known.
 * @param onLanded - Told once it has landed and faded, or given up.
 */
const AFaceFlight = ({ profile, from, to, onLanded }: AFaceFlightProps) => {
  const colours = useTheColours();
  const [moved] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [grown] = useState(() => new Animated.Value(1));
  const [seen] = useState(() => new Animated.Value(1));
  const [isLifted, setIsLifted] = useState(false);
  const [missing, setMissing] = useState(false);
  const picture = thePictureFor(profile);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(moved.y, {
        toValue: -LIFTS_BY,
        duration: LIFTS_OVER,
        easing: EASINGS.outCubic,
        useNativeDriver: true,
      }),
      Animated.timing(grown, {
        toValue: LIFTS_TO,
        duration: LIFTS_OVER,
        easing: EASINGS.outCubic,
        useNativeDriver: true,
      }),
    ]).start();

    const lifting = setTimeout(() => {
      setIsLifted(true);
    }, LIFTS_OVER);

    return () => {
      clearTimeout(lifting);
    };
  }, [moved, grown]);

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
            backgroundColor: backdropOfAFace(
              profile.colour,
              picture !== null && !missing,
              colours.text,
            ),
            borderRadius: from.width / 2,
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
