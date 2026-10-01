import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import type { FieldMenuProps } from './FieldMenu.types';

/**
 * One choice of a connected app's, as a field-shaped menu under its label, saying what is chosen or
 * that nothing is yet.
 *
 * @param label - What is being chosen.
 * @param options - What may be chosen.
 * @param selectedId - What is chosen, or an empty string for nothing.
 * @param placeholder - What the field says while nothing is chosen.
 * @param onSelect - Called with what was chosen.
 */
const FieldMenu = ({ label, options, selectedId, placeholder, onSelect }: FieldMenuProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-medium text-text-muted">{label}</span>

    <OptionMenu
      label={label}
      groups={[{ name: label, selectedId, onSelect, options }]}
      trigger={
        <>
          <span className="truncate">
            {options.find((option) => option.id === selectedId)?.label ?? placeholder}
          </span>
          <Icon of={ChevronsUpDownIcon} size={15} tone="muted" className="shrink-0" />
        </>
      }
      triggerShape="field"
      align="start"
      matchTriggerWidth
    />
  </div>
);

FieldMenu.displayName = 'FieldMenu';

export { FieldMenu };
