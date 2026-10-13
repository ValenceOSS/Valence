import { X } from '@keyline-icons/react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { APlayerPanelProps } from './APlayerPanel.types';

const styles = StyleSheet.create({
  close: { padding: 10, position: 'absolute', zIndex: 1 },
  whole: {
    backgroundColor: PLAYER_LOOK.colours.panel,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

/**
 * A panel laid over the whole picture while a choice is made — the sound and subtitles, the speed,
 * the episodes, the quality or the stats — dark enough to read and fading in rather than snapping,
 * with a way out in the top corner where every player puts it.
 *
 * @param label - What it is, read out when it opens.
 * @param onClose - Told to close it.
 * @param children - What is in it.
 */
const APlayerPanel = ({ label, onClose, children }: APlayerPanelProps) => {
  const room = useSafeAreaInsets();
  const [shown] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(shown, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [shown]);

  return (
    <Animated.View
      style={[
        styles.whole,
        {
          opacity: shown,
          paddingBottom: Math.max(room.bottom, 12),
          paddingLeft: Math.max(room.left, PLAYER_LOOK.edge),
          paddingRight: Math.max(room.right, PLAYER_LOOK.edge),
          paddingTop: Math.max(room.top, 16),
        },
      ]}
      accessibilityViewIsModal
      accessibilityLabel={label}
    >
      {children}

      <View
        style={[
          styles.close,
          { right: Math.max(room.right, PLAYER_LOOK.edge) - 6, top: Math.max(room.top, 10) },
        ]}
      >
        <Button tone="bare" label={label} onPress={onClose}>
          <Icon of={X} size={30} colour={PLAYER_LOOK.colours.text} />
        </Button>
      </View>
    </Animated.View>
  );
};

APlayerPanel.displayName = 'APlayerPanel';

export { APlayerPanel };
