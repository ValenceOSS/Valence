import { X } from '@keyline-icons/react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { ABlur } from '@ValenceMobile/components/ABlur/ABlur';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { APlayerPanelProps } from './APlayerPanel.types';

const styles = StyleSheet.create({
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
 *
 * @param label - What it is, read out when it opens.
 * @param onClose - Told to close it.
 * @param children - What is in it.
 */
const APlayerPanel = ({ label, onClose, children, isAlongTheFoot = false }: APlayerPanelProps) => {
  const room = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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
