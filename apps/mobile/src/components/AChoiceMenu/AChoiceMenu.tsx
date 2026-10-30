import { Platform } from 'react-native';
import { HStack, Host, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  cornerRadius,
  font,
  foregroundStyle,
  padding,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import type { AChoiceMenuProps } from './AChoiceMenu.types';

const CORNER = 12;

/**
 * A choice of one from several, drawn on an iPhone as the app's own buttons are — a rounded square
 * lit faintly in the page's ink, in the app's face — saying what is chosen beside an up-and-down
 * chevron, and opening onto the system's own menu of the rest with a tick by the one chosen. A row of segments that ran off
 * the side of the screen hid half of what there was to choose; a menu shows all of it, however long
 * the names are. Where there is no such menu, the segments stand in.
 *
 * @param label - What is being chosen, for anybody who cannot see the menu.
 * @param items - What there is to choose from.
 * @param value - Which is chosen.
 * @param onSelect - Told which was chosen.
 * @param isDark - Whether it is drawn over something dark, such as a playing film, whatever the
 *   page's own theme.
 */
const AChoiceMenu = ({ label, items, value, onSelect, isDark = false }: AChoiceMenuProps) => {
  const colours = useTheColours();
  const chosen = items.find((item) => item.id === value)?.label ?? label;
  const ink = isDark ? '#ffffff' : colours.text;

  if (Platform.OS !== 'ios') {
    return <SegmentedRow label={label} items={items} value={value} onSelect={onSelect} />;
  }

  return (
    <Host matchContents {...(isDark ? { colorScheme: 'dark' as const } : {})}>
      <Menu
        label={
          <HStack
            spacing={6}
            modifiers={[
              padding({ horizontal: 14, vertical: 9 }),
              background(`${ink}1f`),
              cornerRadius(CORNER),
              foregroundStyle(ink),
            ]}
          >
            <Text modifiers={[font({ family: FONTS.sans.semibold, size: 15 })]}>{chosen}</Text>
            <Image systemName="chevron.up.chevron.down" size={11} />
          </HStack>
        }
        modifiers={[buttonStyle('plain')]}
      >
        <Picker
          label={label}
          selection={value}
          onSelectionChange={(picked) => {
            const found = items.find((item) => item.id === picked);

            if (found !== undefined) {
              onSelect(found.id);
            }
          }}
          modifiers={[pickerStyle('inline')]}
        >
          {items.map((item) => (
            <Text key={item.id} modifiers={[tag(item.id)]}>
              {item.label}
            </Text>
          ))}
        </Picker>
      </Menu>
    </Host>
  );
};

AChoiceMenu.displayName = 'AChoiceMenu';

export { AChoiceMenu };
