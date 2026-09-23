import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { VideoView } from 'expo-video';
import { ABlur } from '@ValencePhone/components/ABlur/ABlur';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { theColours } from '@ValencePhone/theme/theColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { VideoPlayer } from 'expo-video';
import type { TheClipBehindProps } from './TheClipBehind.types';

const FADES_OVER = 900;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * The page's lights, and behind them the hero's clip, blurred until only its colours are left, so
 * the page is lit by whatever the clip is showing as it plays.
 *
 * It is the same player as the hero's, drawn twice rather than played twice, so nothing more is
 * fetched or decoded. The clip sits underneath, blurred all the time it is there, and the lights —
 * on the page's own colour, so nothing shows through them — sit on top: when a clip starts, the
 * lights fade away to show it, and when it stops they fade back over it before it is let go. The
 * blur itself never fades, since a blur that is faded draws wrongly until it is fully there, and
 * it never lies over the lights, so it cannot tint them.
 *
 * The fade only starts once the clip is on screen, since one started before it is there has
 * already finished by the time it appears.
 *
 * @param player - The playing clip, or nothing while none is playing.
 * @param children - The lights the page has without a clip.
 */
const TheClipBehind = ({ player, children }: TheClipBehindProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;
  const [shown] = useState(() => new Animated.Value(0));
  const [held, setHeld] = useState<VideoPlayer | null>(player);

  useEffect(() => {
    if (player !== null) {
      setHeld(player);

      return undefined;
    }

    const fading = Animated.timing(shown, {
      toValue: 0,
      duration: FADES_OVER,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

    fading.start(({ finished }) => {
      if (finished) {
        setHeld(null);
      }
    });

    return () => {
      fading.stop();
    };
  }, [player, shown]);

  useEffect(() => {
    if (held === null || held !== player) {
      return undefined;
    }

    const fading = Animated.timing(shown, {
      toValue: 1,
      duration: FADES_OVER,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

    fading.start();

    return () => {
      fading.stop();
    };
  }, [held, player, shown]);

  return (
    <View pointerEvents="none" style={styles.fills}>
      {held === null ? null : (
        <View style={styles.fills}>
          <VideoView
            player={held}
            nativeControls={false}
            contentFit="cover"
            allowsPictureInPicture={false}
            style={styles.fills}
          />
          <ABlur isDark={isDark} changesOver={0} />
          <View
            style={[
              styles.fills,
              {
                experimental_backgroundImage: `linear-gradient(to bottom, ${withAlpha(colours.surface, 0)} 38%, ${colours.surface} 96%)`,
              },
            ]}
          />
        </View>
      )}

      <Animated.View
        style={[
          styles.fills,
          {
            backgroundColor: colours.surface,
            opacity: shown.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

TheClipBehind.displayName = 'TheClipBehind';

export { TheClipBehind };
