import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { TheNextEpisodeProps } from './TheNextEpisode.types';

const OVER_THE_PICTURE = '#ffffff';

const BEHIND_IT = 'rgba(20, 20, 20, 0.82)';

const ON_THE_PLAY_PILL = '#141414';

const THE_COUNT = 'rgba(0, 0, 0, 0.16)';

const EDGE = 24;

const ARRIVES_MS = 450;

const SLIDES_FROM = 48;

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', gap: 8 },
  counted: {
    backgroundColor: THE_COUNT,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    transformOrigin: 'left center',
    width: '100%',
  },
  creditsPill: {
    backgroundColor: BEHIND_IT,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
  },
  left: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: FONTS.sans.medium,
    fontSize: 12,
    textAlign: 'right',
  },
  pill: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  playPill: { backgroundColor: OVER_THE_PICTURE },
  playSaid: { color: ON_THE_PLAY_PILL },
  said: { color: OVER_THE_PICTURE, fontFamily: FONTS.sans.semibold, fontSize: 14 },
  whole: { bottom: 0, gap: 6, position: 'absolute', right: 0 },
});

/**
 * The offer of the next episode as one ends, in the place of the offer to skip: Watch Credits, and
 * Play Next with a shade sweeping across it until this episode ends and the next starts on its own.
 * For somebody who asked their phone for less motion, the seconds left are written out instead.
 *
 * @param offer - How far the count to the end has got.
 * @param isCounting - Whether the next episode will start on its own at the end.
 * @param onPlay - Told to start it now.
 * @param onWatchCredits - Told to put the offer away and stay with the credits.
 */
const TheNextEpisode = ({ offer, isCounting, onPlay, onWatchCredits }: TheNextEpisodeProps) => {
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const [arriving] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(arriving, {
      toValue: 1,
      duration: ARRIVES_MS,
      easing: EASINGS.outCubic,
      useNativeDriver: true,
    }).start();

    return () => {
      arriving.stopAnimation();
    };
  }, [arriving]);

  return (
    <Animated.View
      style={[
        styles.whole,
        {
          paddingBottom: room.bottom + 84,
          paddingRight: Math.max(room.right, EDGE),
          opacity: arriving,
          transform: isStill
            ? []
            : [
                {
                  translateX: arriving.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SLIDES_FROM, 0],
                  }),
                },
              ],
        },
      ]}
    >
      {isCounting && isStill ? (
        <Text style={styles.left}>
          {sayCount('common.startsInCountSeconds', Math.ceil(offer.secondsLeft))}
        </Text>
      ) : null}

      <View style={styles.choices}>
        <Button tone="bare" onPress={onWatchCredits}>
          <View style={[styles.pill, styles.creditsPill]}>
            <Text style={styles.said}>{say('common.watchCredits')}</Text>
          </View>
        </Button>

        <Button tone="bare" onPress={onPlay}>
          <View style={[styles.pill, styles.playPill]}>
            {isCounting && !isStill ? (
              <View
                style={[
                  styles.counted,
                  { transform: [{ scaleX: Math.min(Math.max(offer.counted, 0), 1) }] },
                ]}
              />
            ) : null}
            <Icon of={PlayFilled} size={14} colour={ON_THE_PLAY_PILL} />
            <Text style={[styles.said, styles.playSaid]}>{say('common.playNextEpisode')}</Text>
          </View>
        </Button>
      </View>
    </Animated.View>
  );
};

TheNextEpisode.displayName = 'TheNextEpisode';

export { TheNextEpisode };
