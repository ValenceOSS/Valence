import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { say } from '@ValenceI18n/say';
import type { ARemoteChoiceProps } from './ARemoteChoice.types';

const styles = StyleSheet.create({
  label: { ...PLAYER_LOOK.styles.action, fontSize: 13 },
  value: { ...PLAYER_LOOK.styles.small, fontSize: 12 },
  whole: { alignItems: 'center', gap: 6, paddingVertical: 8 },
});

/**
 * One of the remote's row of choices, drawn in the player's own look: its icon over what it is, and
 * beneath, where it sets something, what that is set to now.
 *
 * @param icon - What it shows.
 * @param label - What it is.
 * @param value - What it is set to now, where it sets something.
 * @param onPress - Told it was pressed.
 */
const ARemoteChoice = ({ icon, label, value, onPress }: ARemoteChoiceProps) => (
  <Button
    tone="bare"
    label={
      value === undefined
        ? label
        : say('phone.theVideoRemote.aRemoteChoice.labelValue', { label, value })
    }
    onPress={onPress}
  >
    <View style={styles.whole}>
      <Icon of={icon} size={PLAYER_LOOK.icon} colour={PLAYER_LOOK.colours.text} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {value === undefined ? null : (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      )}
    </View>
  </Button>
);

ARemoteChoice.displayName = 'ARemoteChoice';

export { ARemoteChoice };
