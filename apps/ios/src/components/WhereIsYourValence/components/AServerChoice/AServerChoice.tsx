import { StyleSheet, View } from 'react-native';
import { ChevronRight, Server } from 'lucide-react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
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
      label={`Use ${name}`}
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
