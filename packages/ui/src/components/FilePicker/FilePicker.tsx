import { useId, useRef } from 'react';
import { cn } from '@ValenceUI/cn';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { Spinner } from '@ValenceUI/Spinner';
import type { FilePickerProps } from './FilePicker.types';

/**
 * The one place a file is chosen. Wraps the file input that browsers insist on styling their own
 * way in a control that is painted exactly as a `Button` is, and hands back the file itself rather
 * than an event to be unpicked. A bare file input elsewhere is lint-banned.
 *
 * It borrows the button's paint rather than nesting a button inside its label, because a button
 * inside a label swallows the press that was meant to open the file dialog.
 *
 * @param label - What the file is for, read out to anybody who cannot see the control.
 * @param accept - Which kinds of file to offer, as the browser's accept list.
 * @param onPick - Told the file that was chosen.
 * @param children - What the control says — usually an icon and a few words.
 * @param variant - How it is painted, from the same set a `Button` is.
 * @param size - How large it stands, from the same set a `Button` is.
 * @param isLoading - Whether a file is being handled, which shows a spinner and stops another being
 *   chosen.
 * @param isActive - Whether a file is already chosen, drawn as a pressed button is.
 * @param disabled - Whether a file can be chosen at all.
 * @param className - Extra classes for the caller's own layout.
 */
const FilePicker = ({
  label,
  accept,
  onPick,
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  isActive = false,
  disabled = false,
  className,
}: FilePickerProps) => {
  const isDisabled = disabled || isLoading;

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label
      htmlFor={inputId}
      className={cn(
        buttonStyles({ variant, size }),
        'cursor-pointer focus-within:ring-[3px] focus-within:ring-ring',
        isActive ? 'bg-active' : '',
        isDisabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      )}
    >
      <span className="sr-only">{label}</span>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={isDisabled}
        className="sr-only"
        onChange={(event) => {
          const [file] = event.target.files ?? [];

          if (file !== undefined) {
            onPick(file);
          }

          event.target.value = '';
        }}
      />

      {isLoading ? <Spinner size={size === 'sm' ? 'sm' : 'md'} label="Working" /> : null}
      {children}
    </label>
  );
};

FilePicker.displayName = 'FilePicker';

export { FilePicker };
