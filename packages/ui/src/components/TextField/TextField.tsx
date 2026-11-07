import { FIELD_TEXT } from '@ValenceUI/tokens/FIELD_TEXT';
import { FIELD_DISABLED } from '@ValenceUI/tokens/FIELD_DISABLED';
import { FIELD_SURFACE } from '@ValenceUI/tokens/FIELD_SURFACE';
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
 * @param onKeyDown - Told of each key pressed in a single-line field, for a control built on it.
 * @param onFocus - Told when the field takes focus.
 * @param onBlur - Told when the field loses focus.
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
 * @param isBare - Whether to paint no box at all, for a field that supplies its own surface: only a
 *   line beneath it, which brightens while it has focus in place of a ring.
 * @param isInset - Whether it sits inside a box something else draws, such as beside a tag field's
 *   chips, so it paints nothing of its own and leaves the focus ring to that box.
 * @param icon - Something to draw inside the field, such as a magnifying glass.
 * @param trailing - A control to set after the field on the same line, such as a way to browse for
 *   what it asks, kept level with the field however the notes beneath it grow.
 * @param unit - What the value is counted in, such as "/ 10", shown at the end inside the box and
 *   read out with the field.
 * @param inside - A small control set inside the box at its end, such as a link out to the page
 *   of what the field names, so the box keeps the width of the fields beside it.
 * @param joins - Whether the field runs on into the control after it, squared off and without its
 *   own edge on that side, as a split button's halves do.
 * @param hasFocusOnMount - Whether to put the cursor here as soon as it appears.
 * @param inputMode - Which keyboard a phone shows, such as only digits for a PIN.
 * @param ref - Reaches the input itself, so a form can put the cursor back where something is wrong.
 * @param rows - How many lines to show, which makes it a box for several lines rather than one.
 * @param isGrowing - Whether a box for several lines starts a line high and grows with what is
 *   written in it, rather than standing at its rows however little it holds.
 * @param isCode - Whether what is typed is code, drawn in a fixed-width face with no spelling marks.
 * @param areaRef - The box for several lines, for a caller that writes into it where the caret is.
 * @param className - Extra classes for the caller's own layout.
 */
const TextField = ({
  label,
  value,
  onValueChange,
  onKeyDown,
  onFocus,
  onBlur,
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
  inputMode,
  isPill = false,
  size = 'md',
  isBare = false,
  isInset = false,
  isLabelHidden = false,
  icon,
  trailing,
  unit,
  inside,
  joins,
  hasFocusOnMount = false,
  ref,
  rows,
  isGrowing = false,
  isCode = false,
  areaRef,
  className,
}: TextFieldProps) => {
  const fieldId = useId();
  const describedBy = `${fieldId}-said`;
  const wrongBy = `${fieldId}-wrong`;
  const unitBy = `${fieldId}-unit`;
  const isBelow = descriptionPlacement === 'below';
  const describers = [
    ...(description === undefined && !(isBelow && error !== undefined) ? [] : [describedBy]),
    ...(error === undefined || isBelow ? [] : [wrongBy]),
    ...(unit === undefined || rows !== undefined ? [] : [unitBy]),
  ];

  const input = (
    <input
      {...(ref === undefined ? {} : { ref })}
      id={fieldId}
      type={type}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      {...(error === undefined ? {} : { 'aria-invalid': true })}
      {...(describers.length === 0 ? {} : { 'aria-describedby': describers.join(' ') })}
      {...(autoComplete === undefined ? {} : { autoComplete })}
      {...(inputMode === undefined ? {} : { inputMode })}
      {...(min === undefined ? {} : { min })}
      {...(max === undefined ? {} : { max })}
      onChange={(event) => {
        onValueChange(event.currentTarget.value);
      }}
      {...(onKeyDown === undefined ? {} : { onKeyDown })}
      {...(onFocus === undefined ? {} : { onFocus })}
      {...(onBlur === undefined ? {} : { onBlur })}
      autoFocus={hasFocusOnMount}
      className={cn(
        'valence-field text-text outline-none',
        'transition-[color,border-color,box-shadow] duration-[var(--duration-instant)] ease-[var(--ease-out)]',
        'motion-reduce:transition-none placeholder:text-text-muted',
        isInset
          ? 'h-6 bg-transparent px-1 text-[0.8125rem]'
          : isBare
            ? ''
            : 'focus-visible:focus-ring',
        FIELD_DISABLED,
        'w-full',
        type === 'number'
          ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          : '',
        isInset
          ? ''
          : isBare
            ? 'bg-transparent outline-none'
            : cn(FIELD_SURFACE, 'hover:border-[var(--surface-divider)]'),
        isBare || isInset
          ? ''
          : size === 'sm'
            ? 'h-7 px-2.5 text-[0.8125rem]'
            : size === 'lg'
              ? 'h-9 px-3.5 text-sm'
              : size === 'xl'
                ? 'h-12 px-6 text-base'
                : 'h-8 px-3 text-[0.8125rem]',
        isBare && size === 'xl' ? '' : 'coarse:text-[length:max(1rem,1em)]',
        isBare && size === 'xl' ? 'text-2xl tracking-tight sm:text-3xl' : '',
        isBare || isInset || !isPill ? '' : 'rounded-full',
        joins === 'next' ? 'rounded-r-none border-r-0' : '',
        error === undefined ? '' : 'border-destructive',
        unit === undefined ? '' : 'pr-12',
        inside === undefined ? '' : 'pr-9',
      )}
    />
  );

  return (
    <div data-slot="field" className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={fieldId} className={cn(FIELD_TEXT.label, isLabelHidden ? 'sr-only' : '')}>
        {label}
      </label>

      {description === undefined || isBelow ? null : (
        <p id={describedBy} className={FIELD_TEXT.note}>
          {description}
        </p>
      )}

      <span
        className={cn(
          'flex w-full items-center gap-3',
          isBare
            ? 'border-b border-[var(--surface-line)] pb-3 transition-colors duration-[var(--duration-fast)] focus-within:border-text-muted'
            : '',
        )}
      >
        {icon === undefined ? null : <span className="shrink-0 text-text-muted">{icon}</span>}

        {rows === undefined ? null : (
          <textarea
            {...(areaRef === undefined ? {} : { ref: areaRef })}
            id={fieldId}
            rows={rows}
            value={value}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            spellCheck={!isCode}
            {...(error === undefined ? {} : { 'aria-invalid': true })}
            {...(describers.length === 0 ? {} : { 'aria-describedby': describers.join(' ') })}
            onChange={(event) => {
              onValueChange(event.currentTarget.value);
            }}
            {...(onFocus === undefined ? {} : { onFocus })}
            {...(onBlur === undefined ? {} : { onBlur })}
            className={cn(
              'valence-field w-full resize-y px-3 py-2.5 text-text outline-none',
              FIELD_SURFACE,
              'hover:border-[var(--surface-divider)] focus-visible:focus-ring placeholder:text-text-muted',
              FIELD_DISABLED,
              isCode ? 'font-mono text-xs leading-relaxed' : 'text-[0.8125rem] leading-snug',
              isGrowing ? 'field-sizing-content max-h-96 min-h-8 resize-none py-1.5' : '',
              error === undefined ? '' : 'border-destructive',
            )}
          />
        )}

        {rows !== undefined ? null : unit === undefined && inside === undefined ? (
          input
        ) : (
          <span className="relative flex min-w-0 flex-1 items-center">
            {input}
            {unit === undefined ? null : (
              <span
                id={unitBy}
                className="pointer-events-none absolute right-3 text-[0.8125rem] tabular-nums text-text-muted"
              >
                {unit}
              </span>
            )}
            {inside === undefined ? null : (
              <span className="absolute right-1.5 flex items-center">{inside}</span>
            )}
          </span>
        )}

        {trailing === undefined ? null : <span className="flex shrink-0">{trailing}</span>}
      </span>

      {isBelow ? (
        <FieldNote id={describedBy} {...(error === undefined ? {} : { error })}>
          {description}
        </FieldNote>
      ) : error === undefined ? null : (
        <p id={wrongBy} role="alert" className={FIELD_TEXT.error}>
          {error}
        </p>
      )}
    </div>
  );
};

TextField.displayName = 'TextField';

export { TextField };
