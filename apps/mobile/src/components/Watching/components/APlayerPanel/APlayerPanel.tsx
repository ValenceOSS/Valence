import { X } from '@keyline-icons/react-native/fill';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { ABlur } from '@ValenceMobile/components/ABlur/ABlur';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { APlayerPanelProps } from './APlayerPanel.types';

const CARD_WIDEST = 620;

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    paddingBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  cardClose: { padding: 10, position: 'absolute', right: 10, top: 12, zIndex: 1 },
  centred: { alignItems: 'center', justifyContent: 'flex-end' },
  inCard: { flexShrink: 1 },
  grabber: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2.5,
    height: 5,
    position: 'absolute',
    top: 8,
    width: 40,
  },
  close: { padding: 10, position: 'absolute', zIndex: 1 },
  foot: { borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden', top: undefined },
  tint: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  whole: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

/**
 * A panel laid over the whole picture while a choice is made — the sound and subtitles, the speed,
 * the episodes, the quality or the stats — in frosted glass, so the film still shows through
 * blurred, rising from below and sinking away again rather than snapping, with a way out in the
 * top corner where every player puts it. A panel with little in it, such as the speed, sits along
 * the foot instead, so the film stays in view above it.
 *
 * @param isAlongTheFoot - Whether it sits along the foot rather than over the whole picture.
 * @param isACard - Whether it is a solid card rising to sit at the foot of the picture instead, as
 *   the app's cards are — a pill at its top, sized to what it holds, the picture dimmed around it,
 *   and a tap beside it closing it.
 *
 * @param label - What it is, read out when it opens.
 * @param onClose - Told to close it.
 * @param children - What is in it.
 */
const APlayerPanel = ({
  label,
  onClose,
  children,
  isAlongTheFoot = false,
  isACard = false,
}: APlayerPanelProps) => {
  const room = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [shown] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(shown, {
      toValue: 1,
      duration: 320,
      easing: EASINGS.outCubic,
      useNativeDriver: true,
    }).start();
  }, [shown]);

  const leave = () => {
    Animated.timing(shown, {
      toValue: 0,
      duration: 260,
      easing: EASINGS.inCubic,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (isACard) {
    return (
      <View
        style={[styles.whole, styles.centred, { paddingBottom: Math.max(room.bottom, 12) }]}
        accessibilityViewIsModal
        accessibilityLabel={label}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: shown }]}>
          <Button tone="bare" fills label={label} onPress={leave} />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              maxHeight: height - Math.max(room.top, 16) - Math.max(room.bottom, 16),
              opacity: shown,
              transform: [
                { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                { scale: shown.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
              ],
              width: Math.min(
                CARD_WIDEST,
                width - 2 * Math.max(room.left, room.right, PLAYER_LOOK.edge),
              ),
            },
          ]}
        >
          <View style={styles.grabber} pointerEvents="none" />
          <View style={styles.inCard}>{children}</View>
          <View style={styles.cardClose}>
            <Button tone="bare" label={label} onPress={leave}>
              <Icon of={X} size={22} colour={PLAYER_LOOK.colours.text} />
            </Button>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.whole,
        isAlongTheFoot && styles.foot,
        {
          transform: [
            { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) },
          ],
          paddingBottom: Math.max(room.bottom, 12),
          paddingLeft: Math.max(room.left, PLAYER_LOOK.edge),
          paddingRight: Math.max(room.right, PLAYER_LOOK.edge),
          paddingTop: isAlongTheFoot ? 22 : Math.max(room.top, 16),
        },
      ]}
      accessibilityViewIsModal
      accessibilityLabel={label}
    >
      <ABlur isDark changesOver={320} />
      <View style={styles.tint} pointerEvents="none" />

      {children}

      <View
        style={[
          styles.close,
          {
            right: Math.max(room.right, PLAYER_LOOK.edge) - 6,
            top: isAlongTheFoot ? 14 : Math.max(room.top, 10),
          },
        ]}
      >
        <Button tone="bare" label={label} onPress={leave}>
          <Icon of={X} size={PLAYER_LOOK.icon} colour={PLAYER_LOOK.colours.text} />
        </Button>
      </View>
    </Animated.View>
  );
};

APlayerPanel.displayName = 'APlayerPanel';

export { APlayerPanel };
