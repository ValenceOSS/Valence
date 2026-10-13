import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { APlayerActionProps } from './APlayerAction.types';

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});

/**
 * One of the things along the foot of the player, an icon with its name beside it, the way a
 * television's player names what each control does rather than leaving it to be guessed.
 *
 * @param icon - What it looks like.
 * @param label - What it is called.
 * @param onPress - Told it was pressed.
 */
const APlayerAction = ({ icon, label, onPress }: APlayerActionProps) => (
  <Button tone="bare" label={label} onPress={onPress}>
    <View style={styles.row}>
      <Icon of={icon} size={24} colour={PLAYER_LOOK.colours.text} />
      <Text style={PLAYER_LOOK.styles.action} numberOfLines={1}>
        {label}
      </Text>
    </View>
  </Button>
);

APlayerAction.displayName = 'APlayerAction';

export { APlayerAction };
