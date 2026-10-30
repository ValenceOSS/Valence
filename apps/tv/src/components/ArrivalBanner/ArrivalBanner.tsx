import { sayAgain } from '@ValenceI18n/sayAgain';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useRemote } from '@ValenceTv/remote/useRemote';
import { Play } from '@keyline-icons/react-native/fill';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { BANNER_CARD } from '@ValenceTv/theme/BANNER_CARD';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HWEvent } from 'react-native';
import type { ArrivalBannerProps } from './ArrivalBanner.types';
import { sayParts } from '@ValenceI18n/sayParts';

const STAYS_MS = 10_000;

const SLIDES_MS = 320;

const PICTURE = { width: 200, height: 112 };

/**
 * The notice that something this viewer asked for has arrived, or that somebody has asked them into
 * a watch or listening party — the one way a television hears of either — sliding in at the top of
 * the screen beneath the bar: its picture, what it is — and for a party, what is playing there —
 * and how to watch it or join. It never takes the remote from wherever it is — pressing Play/Pause
 * while it shows opens the title, and otherwise it slides away again after a few seconds.
 *
 * @param arrival - The notice.
 * @param picture - The title's picture, where it has one.
 * @param isAnInvitation - Whether it asks them into a party, which pressing Play/Pause joins.
 * @param onWatch - Told when somebody asks to watch it.
 * @param onDismiss - Told when it has gone.
 */
const ArrivalBanner = ({
  arrival,
  picture,
  isAnInvitation = false,
  onWatch,
  onDismiss,
}: ArrivalBannerProps) => {
  const [shown] = useState(() => new Animated.Value(0));
  const isStill = useKeepsStill();

  const leave = useCallback(() => {
    if (isStill) {
      shown.setValue(0);
      onDismiss();

      return;
    }

    Animated.timing(shown, { toValue: 0, duration: SLIDES_MS, useNativeDriver: true }).start(() => {
      onDismiss();
    });
  }, [isStill, shown, onDismiss]);

  useEffect(() => {
    if (isStill) {
      shown.setValue(1);
    } else {
      shown.setValue(0);
      Animated.timing(shown, { toValue: 1, duration: SLIDES_MS, useNativeDriver: true }).start();
    }

    const timer = setTimeout(leave, STAYS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [arrival.id, isStill, shown, leave]);

  const hear = useCallback(
    (event: HWEvent) => {
      if (event.eventType === 'playPause') {
        onWatch();
        onDismiss();
      }
    },
    [onWatch, onDismiss],
  );

  useRemote(hear);

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
        <Text numberOfLines={2} style={styles.title}>
          {sayAgain(arrival.title)}
        </Text>

        {isAnInvitation ? (
          <Text numberOfLines={1} style={styles.press}>
            {sayAgain(arrival.body)}
          </Text>
        ) : null}

        <View style={styles.hint}>
          {sayParts(
            isAnInvitation
              ? 'tv.arrivalBanner.pressPlayToJoin'
              : 'tv.arrivalBanner.pressPlayToWatch',
            {
              play: <Icon of={Play} size={22} colour={tokens.colours.text} />,
            },
          ).map((part, at) =>
            typeof part === 'string' ? (
              <Text key={at.toString()} style={styles.press}>
                {part.trim()}
              </Text>
            ) : (
              <Fragment key={at.toString()}>{part}</Fragment>
            ),
          )}
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
    width: 720,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.sm,
    ...BANNER_CARD,
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
