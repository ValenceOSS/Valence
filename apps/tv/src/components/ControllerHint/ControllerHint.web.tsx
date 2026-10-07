import { useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { say } from '@ValenceI18n/say';
import { whichTv } from '@ValenceTv/native/whichTv';
import { theController } from '@ValenceTv/remote/theController';
import { tokens } from '@ValenceTv/theme/tokens';

/**
 * Tells somebody on an Xbox how to steer Valence with their controller, until it does. Edge on an
 * Xbox opens a page with the controller steering its own pointer, which a page cannot change, so
 * the controller reaches Valence only once Edge's game controls are chosen; the hint goes once it
 * has.
 *
 * @returns The hint, or nothing.
 */
const ControllerHint = () => {
  const isHeard = useSyncExternalStore(theController().whenHeard, theController().isHeard);

  if (isHeard || whichTv() !== 'xbox') {
    return null;
  }

  return (
    <View style={styles.along} pointerEvents="none">
      <View style={styles.hint}>
        <Text style={styles.words}>{say('tv.controllerHint.holdMenuThenChooseGameControls')}</Text>
      </View>
    </View>
  );
};

ControllerHint.displayName = 'ControllerHint';

const styles = StyleSheet.create({
  along: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: tokens.space.lg,
    alignItems: 'center',
  },
  hint: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radii.round,
    backgroundColor: tokens.colours.scrim,
  },
  words: { color: tokens.colours.onScrim, fontSize: tokens.type.small },
});

export { ControllerHint };
