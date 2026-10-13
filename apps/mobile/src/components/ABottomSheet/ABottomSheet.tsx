import { useEffect, useState } from 'react';
import { X } from '@keyline-icons/react-native';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { ABlur } from '@ValenceMobile/components/ABlur/ABlur';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Words } from '@ValenceMobile/components/Words/Words';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ABottomSheetProps } from './ABottomSheet.types';
import { say } from '@ValenceI18n/say';

const ROUND = 28;

const LETS_GO_PAST = 110;

const LETS_GO_FASTER_THAN = 1.1;

const TALLEST = 0.85;

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  grip: { alignItems: 'center', paddingBottom: 6, paddingTop: 10 },
  handle: { borderRadius: 3, height: 5, width: 38 },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    paddingTop: 2,
  },
  rises: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: ROUND,
    borderTopRightRadius: ROUND,
    overflow: 'hidden',
  },
  tint: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  title: { flex: 1 },
});

/**
 * A sheet that rises from the foot of the screen only as far as what it holds, as a music app's
 * connect sheet does, rather than covering the page: the page stays in sight, dimmed, above it.
 * It is frosted glass, as the player's panels are, so the page shows through it blurred, with what
 * it is for across its top beside a way to put it away. It rises above the keyboard when something
 * in it is being typed into. The same on both phones, since it is drawn here rather than by
 * either system.
 *
 * A press on the dimmed page puts it away, and so does dragging it down by its top past a little
 * way or flicking it; let go short of that and it springs back.
 *
 * @param isOpen - Whether it is out.
 * @param label - What it is for, for anybody who cannot see it.
 * @param title - What it says at its top, where it says anything.
 * @param closeLabel - What the way to put it away is called, for anybody who cannot see it.
 * @param onClose - Told to put it away.
 * @param isTall - Whether it rises as far as it may whatever it holds, for something that scrolls.
 * @param children - What it holds.
 */
const ABottomSheet = ({
  isOpen,
  label,
  title,
  closeLabel = say('common.close'),
  onClose,
  isTall = false,
  children,
}: ABottomSheetProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const { height } = useWindowDimensions();
  const [isShowing, setIsShowing] = useState(isOpen);
  const [lowered] = useState(() => new Animated.Value(height));
  const [dimmed] = useState(() => new Animated.Value(0));
  const [latest] = useState(() => new Map([['onClose', onClose]]));

  useEffect(() => {
    latest.set('onClose', onClose);
  });

  useEffect(() => {
    if (isOpen) {
      setIsShowing(true);
      lowered.setValue(height);

      if (isStill) {
        lowered.setValue(0);
        dimmed.setValue(1);

        return;
      }

      Animated.parallel([
        Animated.spring(lowered, { ...SPRINGS.rise, toValue: 0, useNativeDriver: true }),
        Animated.timing(dimmed, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(lowered, {
        toValue: height,
        duration: isStill ? 0 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(dimmed, { toValue: 0, duration: isStill ? 0 : 200, useNativeDriver: true }),
    ]).start(() => {
      setIsShowing(false);
    });
  }, [isOpen, isStill, height, lowered, dimmed]);

  const [drag] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        lowered.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > LETS_GO_PAST || gesture.vy > LETS_GO_FASTER_THAN) {
          latest.get('onClose')?.();

          return;
        }

        Animated.spring(lowered, { ...SPRINGS.rise, toValue: 0, useNativeDriver: true }).start();
      },
    }),
  );

  return (
    <Modal
      visible={isShowing}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: dimmed }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={say('common.close')}
          onPress={onClose}
        />
      </Animated.View>
      <KeyboardAvoidingView
        style={styles.rises}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[
            styles.sheet,
            {
              maxHeight: height * TALLEST,
              height: isTall ? height * TALLEST : undefined,
              paddingBottom: Math.max(room.bottom, SCREEN_EDGE),
              paddingLeft: Math.max(SCREEN_EDGE, room.left),
              paddingRight: Math.max(SCREEN_EDGE, room.right),
              transform: [{ translateY: lowered }],
            },
          ]}
        >
          <ABlur isDark={isDark} changesOver={0} />
          <View
            style={[
              styles.tint,
              { backgroundColor: withAlpha(colours.surface, isDark ? 0.45 : 0.55) },
            ]}
            pointerEvents="none"
          />
          <View {...drag.panHandlers}>
            <View style={styles.grip}>
              <View style={[styles.handle, { backgroundColor: withAlpha(colours.text, 0.28) }]} />
            </View>
            {title === undefined ? null : (
              <View style={styles.head}>
                <View style={styles.title}>
                  <Words size="heading" lines={1}>
                    {title}
                  </Words>
                </View>
                <Button tone="bare" label={closeLabel} onPress={onClose}>
                  <Icon of={X} size={22} colour={colours.text} />
                </Button>
              </View>
            )}
          </View>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

ABottomSheet.displayName = 'ABottomSheet';

export { ABottomSheet };
