import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react/fill';
import { useId } from 'react';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { cn } from '@ValenceUI/cn';
import type { SelectFieldProps } from './SelectField.types';

/**
 * One choice in a form, made from a list rather than typed: labelled, described and refused the way
 * a text field is, at the same height as one, so a form of both reads as one column of questions.
 *
 * @param label - What is being chosen.
 * @param options - What can be chosen.
 * @param value - The one chosen.
 * @param onSelect - Told which was chosen.
 * @param placeholder - What the field says before anything is chosen.
 * @param description - What choosing it does, beneath the label.
 * @param error - Why the choice will not do, beneath the field.
 * @param size - How tall the field stands, to sit level with what is beside it.
 * @param isLabelHidden - Whether the label is only read out, for a field whose purpose is plain.
 * @param className - Extra classes for the caller's own layout.
 */
const SelectField = ({
  label,
  options,
  value,
  onSelect,
  placeholder = '',
  description,
  error,
  size = 'md',
  isLabelHidden = false,
  className,
}: SelectFieldProps) => {
  const labelId = useId();

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
        groups={[{ name: label, selectedId: value, onSelect, options }]}
        trigger={
          <>
            <span className="truncate">
              {options.find((option) => option.id === value)?.label ?? placeholder}
            </span>
            <Icon of={ChevronsUpDownIcon} size={15} tone="muted" className="shrink-0" />
          </>
        }
        triggerShape="field"
        align="start"
        {...(error === undefined ? {} : { className: 'border-destructive' })}
      />

      {error === undefined ? null : (
        <p role="alert" className="font-body text-xs leading-snug text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

SelectField.displayName = 'SelectField';

export { SelectField };
