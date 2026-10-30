import { Platform } from 'react-native';
import { HStack, Host, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import { buttonStyle, font, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import type { AChoiceMenuProps } from './AChoiceMenu.types';

/**
 * A choice of one from several, drawn on an iPhone as a pill of the system's own — on liquid glass
 * where the phone has it — saying what is chosen in the page's own ink beside an up-and-down
 * chevron, and opening onto a menu of the rest with a tick by the one chosen. A row of segments that ran off
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

  if (Platform.OS !== 'ios') {
    return <SegmentedRow label={label} items={items} value={value} onSelect={onSelect} />;
  }

  return (
    <Host matchContents {...(isDark ? { colorScheme: 'dark' as const } : {})}>
      <Menu
        label={
          <HStack spacing={6}>
            <Text modifiers={[font({ size: 16, weight: 'semibold' })]}>{chosen}</Text>
            <Image systemName="chevron.up.chevron.down" size={12} />
          </HStack>
        }
        modifiers={[
          buttonStyle(hasLiquidGlass() ? 'glass' : 'bordered'),
          tint(isDark ? '#ffffff' : colours.text),
        ]}
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
