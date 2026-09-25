import { ChevronRight, Server } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { say } from '@ValenceI18n/say';
import type { AServerChoiceProps } from './AServerChoice.types';

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  said: { flex: 1, gap: 2 },
});

/**
 * One Valence to choose, as the desktop lists the ones it found on the network and the ones it has
 * used before: what it is called and the address it answers on, pressed to use it. Where it is
 * called by its address, the address is not said twice.
 *
 * @param name - What it is called.
 * @param address - Where it answers.
 * @param onChoose - Told its address.
 */
const AServerChoice = ({ name, address, onChoose }: AServerChoiceProps) => {
  const colours = useTheColours();
  const shown = address.replace(/^https?:\/\//u, '');

  return (
    <Button
      tone="bare"
      label={say('phone.aServerChoice.use', { name })}
      onPress={() => {
        onChoose(address);
      }}
    >
      <View style={[styles.row, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
        <Icon of={Server} colour={colours.text} />

        <View style={styles.said}>
          <Words lines={1}>{name}</Words>
          {name === shown ? null : (
            <Words size="small" tone="muted" lines={1}>
              {shown}
            </Words>
          )}
        </View>

        <Icon of={ChevronRight} colour={colours.textMuted} />
      </View>
    </Button>
  );
};

AServerChoice.displayName = 'AServerChoice';

export { AServerChoice };
