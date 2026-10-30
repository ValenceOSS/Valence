import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Smartphone } from '@keyline-icons/react-native';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { BANNER_CARD } from '@ValenceTv/theme/BANNER_CARD';
import { tokens } from '@ValenceTv/theme/tokens';
import type { StartedFromProps } from './StartedFrom.types';
import { say } from '@ValenceI18n/say';

const FADES_MS = 500;

const STAYS_MS = 8000;

const HIGH = 64;

const TITLE_LINE = tokens.type.heading * 1.2;

/**
 * Which device started the film here, on a dark card in the top right corner, level with the
 * player's title, as the film begins: fading in, staying long enough to be read from across the
 * room, and fading away, so the room knows a phone put it on. It is drawn as the arrival banner is,
 * so it reads as a card over the black above a film as well as over a bright picture. A
 * television's browser, which keeps still, shows it and takes it away without the fades.
 *
 * @param label - The device's own name, such as Dan's iPhone.
 */
const StartedFrom = ({ label }: StartedFromProps) => {
  const isStill = useKeepsStill();
  const [shown] = useState(() => new Animated.Value(isStill ? 1 : 0));
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    if (isStill) {
      const gone = setTimeout(() => {
        setIsGone(true);
      }, STAYS_MS);

      return () => {
        clearTimeout(gone);
      };
    }

    const showing = Animated.sequence([
      Animated.timing(shown, { toValue: 1, duration: FADES_MS, useNativeDriver: true }),
      Animated.delay(STAYS_MS),
      Animated.timing(shown, { toValue: 0, duration: FADES_MS, useNativeDriver: true }),
    ]);

    showing.start(({ finished }) => {
      if (finished) {
        setIsGone(true);
      }
    });

    return () => {
      showing.stop();
    };
  }, [isStill, shown]);

  if (isGone) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.corner,
        {
          opacity: shown,
          transform: [
            { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.card}>
        <Icon of={Smartphone} size={30} colour={tokens.colours.text} />
        <Text style={styles.said} numberOfLines={1}>
          {say('tv.player.startedFromLabel', { label })}
        </Text>
      </View>
    </Animated.View>
  );
};

StartedFrom.displayName = 'StartedFrom';

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    top: tokens.space.xl + TITLE_LINE / 2 - HIGH / 2,
    right: tokens.space.edge,
    maxWidth: 720,
  },
  card: {
    height: HIGH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    ...BANNER_CARD,
  },
  said: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
    flexShrink: 1,
  },
});

export { StartedFrom };
