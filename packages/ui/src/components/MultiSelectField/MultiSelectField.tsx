import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react/fill';
import { useId } from 'react';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { cn } from '@ValenceUI/cn';
import type { MultiSelectFieldProps } from './MultiSelectField.types';

/**
 * A field where any number of choices can be made, drawn and opened exactly as a select field is:
 * a label, what it is for, and the choices in force written out in the field. Its menu stays open
 * while choices are ticked and unticked, so several can be made in one go. A choice that is locked
 * is always in force and cannot be taken off, for something that is on whatever anybody chooses.
 *
 * @param label - What is being chosen.
 * @param options - The choices, in the order they are offered.
 * @param value - The ids of the choices in force.
 * @param onChange - Told the ids in force after each change, in the order the choices are offered.
 * @param placeholder - What the field says while nothing is chosen.
 * @param description - What the choice is for, beneath the label.
 * @param size - How tall the field is, to sit level with the fields beside it.
 * @param isLabelHidden - Whether the label is read out only, where a heading beside it says it.
 * @param className - Extra classes for the caller's own layout.
 */
const MultiSelectField = ({
  label,
  options,
  value,
  onChange,
  placeholder = '',
  description,
  size = 'md',
  isLabelHidden = false,
  className,
}: MultiSelectFieldProps) => {
  const labelId = useId();
  const lockedIds = options.filter((option) => option.isLocked === true).map((option) => option.id);
  const chosen = new Set([...value, ...lockedIds]);
  const summary = options
    .filter((option) => chosen.has(option.id))
    .map((option) => option.label)
    .join(', ');

  return (
    <div data-slot="field" className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span
        id={labelId}
        className={cn('text-[0.8125rem] font-medium text-text', isLabelHidden ? 'sr-only' : '')}
      >
        {label}
      </span>

      {description === undefined ? null : (
        <p className="font-body text-xs leading-snug text-text-muted">{description}</p>
      )}

      <OptionMenu
        label={label}
        size={size}
        groups={[
          {
            name: label,
            options: options.map((option) => ({ id: option.id, label: option.label })),
            selectedIds: [...chosen],
            lockedIds,
            onToggle: (id, isChosen) => {
              const next = new Set(chosen);

              if (isChosen) {
                next.add(id);
              } else {
                next.delete(id);
              }

              onChange(options.filter((option) => next.has(option.id)).map((option) => option.id));
            },
          },
        ]}
        trigger={
          <>
            <span className={cn('truncate', summary === '' ? 'text-text-muted' : '')}>
              {summary === '' ? placeholder : summary}
            </span>
            <Icon of={ChevronsUpDownIcon} size={15} tone="muted" className="shrink-0" />
          </>
        }
        triggerShape="field"
        align="start"
      />
    </div>
  );
};

MultiSelectField.displayName = 'MultiSelectField';

export { MultiSelectField };
