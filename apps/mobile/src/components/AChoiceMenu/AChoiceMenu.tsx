import { Platform } from 'react-native';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import type { AChoiceMenuProps } from './AChoiceMenu.types';

/**
 * A choice of one from several, drawn on an iPhone as the system's own pop-up menu — the one
 * Settings uses — showing what is chosen and opening onto the rest. A row of segments that ran off
 * the side of the screen hid half of what there was to choose; a menu shows all of it, however long
 * the names are. Where there is no such menu, the segments stand in.
 *
 * @param label - What is being chosen, for anybody who cannot see the menu.
 * @param items - What there is to choose from.
 * @param value - Which is chosen.
 * @param onSelect - Told which was chosen.
 */
const AChoiceMenu = ({ label, items, value, onSelect }: AChoiceMenuProps) => {
  if (Platform.OS !== 'ios') {
    return <SegmentedRow label={label} items={items} value={value} onSelect={onSelect} />;
  }

  return (
    <Host matchContents>
      <Picker
        label={label}
        selection={value}
        onSelectionChange={(chosen) => {
          const picked = items.find((item) => item.id === chosen);

          if (picked !== undefined) {
            onSelect(picked.id);
          }
        }}
        modifiers={[pickerStyle('menu')]}
      >
        {items.map((item) => (
          <Text key={item.id} modifiers={[tag(item.id)]}>
            {item.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
};

AChoiceMenu.displayName = 'AChoiceMenu';

export { AChoiceMenu };
