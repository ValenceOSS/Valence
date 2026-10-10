import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import type { ScopedFieldProps } from './ScopedField.types';

/**
 * A field for typing in, with what it is typed into chosen at its end: a search that can look for
 * films or series, say, or for sites of one category and language. Joined the way a split button
 * is, the field running on into each choice across a hairline, since together they are one
 * question — what, and of which kinds.
 *
 * @param label - What the field asks for.
 * @param value - What has been typed.
 * @param onValueChange - Told what is typed.
 * @param choices - What narrows it, each with what it decides, its options, the one in force and
 *   who to tell of another.
 * @param placeholder - What the field shows while nothing has been typed.
 * @param isLabelHidden - Whether the label is only read out, not shown.
 * @param hasFocusOnMount - Whether to put the cursor here as soon as it appears.
 * @param className - Extra classes for the caller's own layout.
 */
const ScopedField = ({
  label,
  value,
  onValueChange,
  choices,
  placeholder,
  isLabelHidden = false,
  hasFocusOnMount = false,
  className,
}: ScopedFieldProps) => (
  <div className={cn('flex min-w-0 items-end', className)}>
    <TextField
      label={label}
      value={value}
      onValueChange={onValueChange}
      isLabelHidden={isLabelHidden}
      hasFocusOnMount={hasFocusOnMount}
      {...(choices.length === 0 ? {} : { joins: 'next' as const })}
      {...(placeholder === undefined ? {} : { placeholder })}
      className="min-w-0 flex-1"
    />

    {choices.map((choice, index) => (
      <OptionMenu
        key={choice.label}
        label={choice.label}
        triggerShape="fieldJoined"
        align="end"
        groups={[
          {
            name: choice.label,
            options: choice.options,
            selectedId: choice.value,
            onSelect: choice.onChange,
          },
        ]}
        trigger={
          <>
            <span className="whitespace-nowrap">
              {choice.options.find((one) => one.id === choice.value)?.label ?? ''}
            </span>
            <Icon of={ChevronDownIcon} size={14} tone="muted" className="shrink-0" />
          </>
        }
        {...(index === choices.length - 1 ? {} : { className: 'rounded-r-none border-r-0' })}
      />
    ))}
  </div>
);

ScopedField.displayName = 'ScopedField';

export { ScopedField };
