import { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, useTVEventHandler, View } from 'react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HWEvent } from 'react-native';
import type { ArrivalBannerProps } from './ArrivalBanner.types';

const STAYS_MS = 10_000;

const SLIDES_MS = 320;

const PICTURE = { width: 200, height: 112 };

/**
 * The notice that something this viewer asked for has arrived, sliding in at the top of the screen
 * beneath the bar: its picture, that it is ready, and how to watch it. It never takes the remote
 * from wherever it is — pressing Play/Pause while it shows opens the title, and otherwise it slides
 * away again after a few seconds.
 *
 * @param arrival - The notice.
 * @param picture - The title's picture, where it has one.
 * @param onWatch - Told when somebody asks to watch it.
 * @param onDismiss - Told when it has gone.
 */
const ArrivalBanner = ({ arrival, picture, onWatch, onDismiss }: ArrivalBannerProps) => {
  const shown = useRef(new Animated.Value(0)).current;

  const leave = useCallback(() => {
    Animated.timing(shown, { toValue: 0, duration: SLIDES_MS, useNativeDriver: true }).start(() => {
      onDismiss();
    });
  }, [shown, onDismiss]);

  useEffect(() => {
    shown.setValue(0);
    Animated.timing(shown, { toValue: 1, duration: SLIDES_MS, useNativeDriver: true }).start();

    const timer = setTimeout(leave, STAYS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [arrival.id, shown, leave]);

  const hear = useCallback(
    (event: HWEvent) => {
      if (event.eventType === 'playPause') {
        onWatch();
        onDismiss();
      }
    },
    [onWatch, onDismiss],
  );

  useTVEventHandler(hear);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        {
          opacity: shown,
          transform: [
            { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
          ],
        },
      ]}
    >
      <View style={[styles.picture, PICTURE]}>
        <Artwork path={picture} style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.words}>
        <Text numberOfLines={1} style={styles.title}>
          {arrival.title}
        </Text>

        <View style={styles.hint}>
          <Text style={styles.press}>Press</Text>
          <Icon of={Play} size={22} colour={tokens.colours.text} />
          <Text style={styles.press}>to watch</Text>
        </View>
      </View>
    </Animated.View>
  );
};

ArrivalBanner.displayName = 'ArrivalBanner';

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 120,
    right: tokens.space.edge,
    width: 640,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.sm,
    borderRadius: tokens.radii.xl,
    backgroundColor: 'rgba(28,28,30,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  picture: {
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  words: { flex: 1, gap: tokens.space.xs },
  title: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '700' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs },
  press: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { ArrivalBanner };
