import { cn } from '@ValenceUI/cn';
import { TextField } from '@ValenceUI/TextField';
import type { PinFieldProps } from './PinField.types';

const SHORTEST = 4;
const LONGEST = 8;

/**
 * Where a PIN is typed: a row of boxes, one a digit, each typed digit shown as a dot and the box the
 * next one goes in lit while the field has focus. There are four boxes, and another appears with
 * each digit typed past the fourth, up to eight, so a four digit PIN never looks unfinished. The
 * typing itself is done by a TextField laid unseen over the boxes, so pasting, a password manager
 * and a phone's number pad all work as they would anywhere, and the description is read out from
 * there. The error is said once, beneath the boxes, as an alert.
 *
 * @param label - What the PIN is for.
 * @param value - The digits typed so far.
 * @param onValueChange - Told the digits, anything else typed or pasted taken out.
 * @param description - A line under the label, such as how long a PIN may be.
 * @param error - What is wrong with what was typed.
 * @param isNew - Whether a new PIN is being chosen, so a password manager offers to save it.
 * @param hasFocusOnMount - Whether it takes focus as it appears.
 * @param className - Extra classes for the caller's own layout.
 */
const PinField = ({
  label,
  value,
  onValueChange,
  description,
  error,
  isNew = false,
  hasFocusOnMount = false,
  className,
}: PinFieldProps) => {
  const boxes = Math.min(LONGEST, Math.max(SHORTEST, value.length));
  const next = Math.min(value.length, boxes - 1);

  return (
    <div data-slot="pin-field" className={cn('group/pin flex flex-col gap-1.5', className)}>
      <span aria-hidden className="text-[0.8125rem] font-medium text-text">
        {label}
      </span>

      {description === undefined ? null : (
        <p aria-hidden className="font-body text-xs leading-snug text-text-muted">
          {description}
        </p>
      )}

      <div className="relative flex gap-2">
        {Array.from({ length: boxes }, (_, at) => (
          <span
            key={at}
            aria-hidden
            data-slot="pin-box"
            className={cn(
              'flex h-12 w-11 items-center justify-center rounded-md border bg-[var(--surface-hover)] backdrop-blur-xl',
              'transition-[border-color,box-shadow] duration-[var(--duration-instant)] ease-[var(--ease-out)] motion-reduce:transition-none',
              error === undefined ? 'border-[var(--surface-line)]' : 'border-destructive',
              at === next
                ? 'group-focus-within/pin:ring-[3px] group-focus-within/pin:ring-ring'
                : '',
            )}
          >
            {at < value.length ? <span className="size-2.5 rounded-full bg-text" /> : null}
            {at === value.length ? (
              <span className="hidden h-5 w-px animate-pulse bg-text group-focus-within/pin:block motion-reduce:animate-none" />
            ) : null}
          </span>
        ))}

        <TextField
          label={label}
          value={value}
          onValueChange={(typed) => {
            onValueChange(typed.replace(/\D/gu, '').slice(0, LONGEST));
          }}
          type="password"
          inputMode="numeric"
          autoComplete={isNew ? 'new-password' : 'off'}
          isLabelHidden
          isBare
          hasFocusOnMount={hasFocusOnMount}
          {...(description === undefined ? {} : { description })}
          className={cn(
            'absolute inset-0 gap-0',
            '[&>span]:h-full [&>span]:border-0 [&>span]:p-0 [&_input]:h-full [&_input]:cursor-text [&_input]:opacity-0',
            '[&_p]:sr-only',
          )}
        />
      </div>

      {error === undefined ? null : (
        <p role="alert" className="font-body text-xs leading-snug text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

PinField.displayName = 'PinField';

export { PinField };
