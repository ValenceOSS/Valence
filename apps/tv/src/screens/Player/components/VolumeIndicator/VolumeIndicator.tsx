import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Volume, VolumeLow, VolumeX } from '@keyline-icons/react-native';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { BANNER_CARD } from '@ValenceTv/theme/BANNER_CARD';
import { tokens } from '@ValenceTv/theme/tokens';
import type { VolumeIndicatorProps } from './VolumeIndicator.types';
import { say } from '@ValenceI18n/say';

const FADES_MS = 250;

const HIGH = 64;

const BAR_WIDE = 280;

const BAR_HIGH = 10;

/**
 * How loud the film plays, on a dark card at the top of the screen as the arrival banner is drawn:
 * a speaker, quiet, loud or struck through at nothing, and a bar filled as far as the volume goes.
 * It fades in as the volume is turned from another device and away a moment after, and a
 * television that keeps still shows it and takes it away without the fades.
 *
 * @param level - How loud, from nothing to all the way up.
 * @param isShown - Whether to show it now.
 */
const VolumeIndicator = ({ level, isShown }: VolumeIndicatorProps) => {
  const isStill = useKeepsStill();
  const [shown] = useState(() => new Animated.Value(isShown ? 1 : 0));
  const [isAway, setIsAway] = useState(!isShown);

  useEffect(() => {
    if (isShown) {
      setIsAway(false);
    }

    if (isStill) {
      shown.setValue(isShown ? 1 : 0);
      setIsAway(!isShown);

      return undefined;
    }

    const fading = Animated.timing(shown, {
      toValue: isShown ? 1 : 0,
      duration: FADES_MS,
      useNativeDriver: true,
    });

    fading.start(({ finished }) => {
      if (finished && !isShown) {
        setIsAway(true);
      }
    });

    return () => {
      fading.stop();
    };
  }, [isShown, isStill, shown]);

  if (isAway) {
    return null;
  }

  const percent = Math.round(level * 100);

  return (
    <View style={styles.top} pointerEvents="none">
      <Animated.View
        style={[styles.card, { opacity: shown }]}
        accessible
        accessibilityLabel={say('common.volume')}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        accessibilityLiveRegion="polite"
      >
        <Icon
          of={level === 0 ? VolumeX : level < 0.5 ? VolumeLow : Volume}
          size={30}
          colour={tokens.colours.text}
        />
        <View style={styles.bar}>
          <View style={[styles.filled, { flex: level }]} />
          <View style={{ flex: 1 - level }} />
        </View>
      </Animated.View>
    </View>
  );
};

VolumeIndicator.displayName = 'VolumeIndicator';

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: tokens.space.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  card: {
    height: HIGH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    ...BANNER_CARD,
  },
  bar: {
    flexDirection: 'row',
    width: BAR_WIDE,
    height: BAR_HIGH,
    borderRadius: tokens.radii.round,
    backgroundColor: tokens.colours.line,
    overflow: 'hidden',
  },
  filled: {
    borderRadius: tokens.radii.round,
    backgroundColor: tokens.colours.text,
  },
});

export { VolumeIndicator };
