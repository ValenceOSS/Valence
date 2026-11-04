import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import type { SettingMenuProps } from './SettingMenu.types';

/**
 * The menu a setting row answers with: the chosen option in a field-shaped button that opens the
 * rest, at the width every menu in a settings card shares.
 *
 * @param label - What the setting is.
 * @param value - The option chosen.
 * @param options - Every option.
 * @param onSelect - Told the option chosen.
 * @param fallback - What to show where the value is none of the options.
 */
const SettingMenu = ({ label, value, options, onSelect, fallback }: SettingMenuProps) => (
  <OptionMenu
    label={label}
    groups={[{ name: label, selectedId: value, onSelect, options: [...options] }]}
    trigger={
      <>
        <span className="truncate">
          {options.find((option) => option.id === value)?.label ?? fallback ?? value}
        </span>
        <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
      </>
    }
    triggerShape="field"
    align="end"
    className="w-44 max-w-full"
  />
);

SettingMenu.displayName = 'SettingMenu';

export { SettingMenu };
