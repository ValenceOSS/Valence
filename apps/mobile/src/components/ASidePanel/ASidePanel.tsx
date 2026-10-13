import { X } from '@keyline-icons/react-native/fill';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { SIDE_PANEL } from '@ValenceMobile/components/ASidePanel/SIDE_PANEL';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import { ABlur } from '@ValenceMobile/components/ABlur/ABlur';
import type { ASidePanelProps } from './ASidePanel.types';

const WIDE = 300;

const styles = StyleSheet.create({
  behind: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  inside: { gap: 22, paddingBottom: SIDE_PANEL.edge },
  panel: {
    overflow: 'hidden',
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: WIDE,
  },
  tint: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  top: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  topWord: { color: SIDE_PANEL.colours.text, fontSize: 17, fontFamily: FONTS.sans.semibold },
});

/**
 * A panel come in from the side of the player, over the picture, closed by its cross or by a touch
 * anywhere on the film beside it.
 *
 * It comes in from the side rather than up from the bottom, because this screen is sideways and a
 * sheet rising into a landscape phone covers the film it is asking about.
 *
 * @param title - What it is.
 * @param closeLabel - What closing it says, for somebody who cannot see the cross.
 * @param onClose - Told they are done with it.
 * @param children - What is in it.
 */
const ASidePanel = ({ title, closeLabel, onClose, children }: ASidePanelProps) => {
  const room = useSafeAreaInsets();
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
    <View style={styles.behind}>
      <Button tone="bare" fills label={closeLabel} onPress={leave}>
        <View style={styles.behind} />
      </Button>

      <Animated.View
        style={[
          styles.panel,
          {
            paddingRight: Math.max(room.right, SIDE_PANEL.edge),
            transform: [
              { translateX: shown.interpolate({ inputRange: [0, 1], outputRange: [WIDE, 0] }) },
            ],
          },
        ]}
      >
        <ABlur isDark changesOver={320} />
        <View style={styles.tint} pointerEvents="none" />

        <ScrollView
          contentContainerStyle={[
            styles.inside,
            { paddingLeft: SIDE_PANEL.edge, paddingTop: room.top + 18 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.top}>
            <Text style={styles.topWord}>{title}</Text>

            <Button tone="bare" label={closeLabel} onPress={leave}>
              <Icon of={X} size={22} colour={SIDE_PANEL.colours.text} />
            </Button>
          </View>

          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

ASidePanel.displayName = 'ASidePanel';

export { ASidePanel };
