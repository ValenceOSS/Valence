// oxlint-disable react/refs -- the gesture's handlers run while a thumb drags rather than during a render. Where the drag began and the level last set are read many times a second, nothing is drawn from the refs, and they must outlive the renders the drag causes.
import { Sun } from '@keyline-icons/react-native';
import * as Brightness from 'expo-brightness';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { ABrightnessProps } from './ABrightness.types';
import { say } from '@ValenceI18n/say';

const TALL = 130;

const REACH = 44;

const styles = StyleSheet.create({
  filled: {
    backgroundColor: PLAYER_LOOK.colours.text,
    borderRadius: 3,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  reach: { alignItems: 'center', height: TALL, justifyContent: 'center', width: REACH },
  track: {
    backgroundColor: PLAYER_LOOK.colours.rest,
    borderRadius: 3,
    height: TALL,
    overflow: 'hidden',
    width: 6,
  },
  whole: { alignItems: 'center', gap: 14 },
});

/**
 * The screen's brightness, as a line up the side of the player that a thumb drags, because a film
 * watched in the dark wants a dimmer screen than the menus it was chosen from, and reaching for the
 * system's own control means leaving the film to do it.
 *
 * @param onTouched - Told it is being used, so the controls do not fade out from under it.
 */
const ABrightness = ({ onTouched }: ABrightnessProps) => {
  const [level, setLevel] = useState(0.5);
  const startedAt = useRef(0.5);
  const latest = useRef(0.5);

  useEffect(() => {
    void Brightness.getBrightnessAsync()
      .then((read) => {
        latest.current = read;
        setLevel(read);
      })
      .catch(() => undefined);
  }, []);

  const [dragging] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startedAt.current = latest.current;
        onTouched();
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(1, Math.max(0, startedAt.current - gesture.dy / TALL));

        latest.current = next;
        setLevel(next);
        onTouched();
        void Brightness.setBrightnessAsync(next).catch(() => undefined);
      },
    }),
  );

  return (
    <View
      style={styles.whole}
      accessibilityLabel={say('phone.watching.brightness')}
      accessibilityRole="adjustable"
    >
      <Icon of={Sun} size={PLAYER_LOOK.icon} colour={PLAYER_LOOK.colours.text} />
      <View style={styles.reach} {...dragging.panHandlers}>
        <View style={styles.track}>
          <View style={[styles.filled, { height: `${(level * 100).toFixed(1)}%` }]} />
        </View>
      </View>
    </View>
  );
};

ABrightness.displayName = 'ABrightness';

export { ABrightness };
