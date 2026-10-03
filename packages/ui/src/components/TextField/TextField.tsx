import { useId } from 'react';
import { FieldNote } from './components/FieldNote/FieldNote';
import { cn } from '@ValenceUI/cn';
import type { TextFieldProps } from './TextField.types';

/**
 * The one place a single line of text is typed. Owns the label, the description and the error
 * together, so a field is always announced with whatever explains it rather than leaving a caller
 * to remember the wiring. Every text input in Valence is this or composes it — a bare input elsewhere
 * is lint-banned.
 *
 * @param label - What is being asked for, shown unless the caller hides it.
 * @param value - What the field holds now.
 * @param onValueChange - Told the new text on every keystroke.
 * @param type - Which kind of input, such as a search box or a password.
 * @param description - A line explaining what is wanted.
 * @param descriptionPlacement - Where that line sits: between the label and the field, or under the
 *   field, where an error takes its place and the change is animated. Fields side by side in a row
 *   put it under, so their inputs line up whatever each one says.
 * @param error - What is wrong with what was typed.
 * @param placeholder - What to show while the field is empty.
 * @param required - Whether the form refuses to submit without it.
 * @param disabled - Whether it can be typed in at all.
 * @param min - The smallest acceptable value, for a numeric field.
 * @param max - The largest acceptable value, for a numeric field.
 * @param isPill - Whether to round it fully, for a field sitting in a bar rather than a form.
 * @param size - How large to draw it.
 * @param isBare - Whether to paint no box at all, for a field that supplies its own surface.
 * @param icon - Something to draw inside the field, such as a magnifying glass.
 * @param trailing - A control to set after the field on the same line, such as a way to browse for
 *   what it asks, kept level with the field however the notes beneath it grow.
 * @param hasFocusOnMount - Whether to put the cursor here as soon as it appears.
 * @param className - Extra classes for the caller's own layout.
 */
const TextField = ({
  label,
  value,
  onValueChange,
  type = 'text',
  description,
  descriptionPlacement = 'above',
  error,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  autoComplete,
  isPill = false,
  size = 'md',
  isBare = false,
  isLabelHidden = false,
  icon,
  trailing,
  hasFocusOnMount = false,
  className,
}: TextFieldProps) => {
  const fieldId = useId();
  const describedBy = `${fieldId}-said`;
  const isBelow = descriptionPlacement === 'below';

  return (
    <div data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={fieldId}
        className={cn('text-[0.8125rem] font-medium text-text', isLabelHidden ? 'sr-only' : '')}
      >
        {label}
      </label>

      {description === undefined || isBelow ? null : (
        <p id={describedBy} className="font-body text-xs leading-snug text-text-muted">
          {description}
        </p>
      )}

      <span
        className={cn(
          'flex w-full items-center gap-3',
          isBare ? 'border-b border-[var(--surface-line)] pb-3' : '',
        )}
      >
        {icon === undefined ? null : <span className="shrink-0 text-text-muted">{icon}</span>}

        <input
          id={fieldId}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          {...(error === undefined ? {} : { 'aria-invalid': true })}
          {...(description === undefined && !(isBelow && error !== undefined)
            ? {}
            : { 'aria-describedby': describedBy })}
          {...(autoComplete === undefined ? {} : { autoComplete })}
          {...(min === undefined ? {} : { min })}
          {...(max === undefined ? {} : { max })}
          onChange={(event) => {
            onValueChange(event.currentTarget.value);
          }}
          autoFocus={hasFocusOnMount}
          className={cn(
            'valence-field text-text outline-none',
            'transition-[color,border-color,box-shadow] duration-[var(--duration-instant)] ease-[var(--ease-out)]',
            'motion-reduce:transition-none placeholder:text-text-muted',
            'focus-visible:ring-[3px] focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'w-full',
            isBare
              ? 'bg-transparent outline-none'
              : 'border border-[var(--surface-line)] bg-[var(--surface-hover)] backdrop-blur-xl hover:border-[var(--surface-divider)]',
            isBare
              ? ''
              : size === 'sm'
                ? 'h-7 px-2.5 text-xs'
                : size === 'lg'
                  ? 'h-9 px-3.5 text-sm'
                  : size === 'xl'
                    ? 'h-12 px-6 text-base'
                    : 'h-8 px-3 text-[0.8125rem]',
            isBare && size === 'xl' ? 'text-2xl tracking-tight sm:text-3xl' : '',
            isBare ? '' : isPill ? 'rounded-full' : 'rounded-md',
            error === undefined ? '' : 'border-destructive',
          )}
        />

        {trailing === undefined ? null : <span className="flex shrink-0">{trailing}</span>}
      </span>

      {isBelow ? (
        <FieldNote id={describedBy} {...(error === undefined ? {} : { error })}>
          {description}
        </FieldNote>
      ) : error === undefined ? null : (
        <p role="alert" className="font-body text-xs leading-snug text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

TextField.displayName = 'TextField';

export { TextField };
