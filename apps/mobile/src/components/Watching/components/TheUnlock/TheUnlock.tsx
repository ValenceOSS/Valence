import { Lock } from '@keyline-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { TheUnlockProps } from './TheUnlock.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    backgroundColor: PLAYER_LOOK.colours.scrim,
    borderRadius: 26,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  place: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
});

/**
 * The one thing drawn while the controls are locked: a way to unlock them, shown when the picture
 * is tapped, so a film can be held, passed round or watched in bed without a stray thumb pausing it.
 *
 * @param onUnlock - Told to unlock the controls.
 */
const TheUnlock = ({ onUnlock }: TheUnlockProps) => {
  const room = useSafeAreaInsets();

  return (
    <View style={[styles.place, { bottom: room.bottom + 28 }]} pointerEvents="box-none">
      <Button tone="bare" label={say('phone.watching.unlockTheControls')} onPress={onUnlock}>
        <View style={styles.pill}>
          <Icon of={Lock} size={20} colour={PLAYER_LOOK.colours.text} />
          <Text style={PLAYER_LOOK.styles.action}>{say('phone.watching.unlockTheControls')}</Text>
        </View>
      </Button>
    </View>
  );
};

TheUnlock.displayName = 'TheUnlock';

export { TheUnlock };
