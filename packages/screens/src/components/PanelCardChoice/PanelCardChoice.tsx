import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import type { PanelCardChoiceProps } from './PanelCardChoice.types';

/**
 * A choice in the corner of a card between ways of showing what it holds, such as how far back a
 * chart reaches: the one chosen in words, opening a menu of the rest. Drawn as the card's actions
 * are, transparent and small with the words first, so a card that can be shown several ways says
 * which way it is showing rather than laying every way out as a row of tabs.
 *
 * @param label - What is being chosen, read out and set above the choices.
 * @param options - The ways it can be shown, in the order they are offered.
 * @param value - The one chosen.
 * @param onSelect - Told which was chosen.
 */
const PanelCardChoice = ({ label, options, value, onSelect }: PanelCardChoiceProps) => (
  <OptionMenu
    label={label}
    triggerShape="quiet"
    align="end"
    trigger={
      <>
        {options.find((option) => option.id === value)?.label ?? value}
        <Icon of={ChevronDownIcon} size={14} />
      </>
    }
    groups={[{ name: label, options: [...options], selectedId: value, onSelect }]}
  />
);

PanelCardChoice.displayName = 'PanelCardChoice';

export { PanelCardChoice };
