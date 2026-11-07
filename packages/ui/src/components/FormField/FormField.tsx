import { FIELD_TEXT } from '@ValenceUI/tokens/FIELD_TEXT';
import { cn } from '@ValenceUI/cn';
import type { FormFieldProps } from './FormField.types';

/**
 * One thing a form asks for: what it is, what answering it means, and the control that answers it,
 * stacked in that order. The same shape for every field in every dialog — a form whose rows each
 * arrange themselves reads as several forms in one panel, and the eye has to hunt for the next
 * question rather than running down a column to it.
 *
 * Stacked rather than set side by side, because a form inside a companion column has a third of the
 * room a dialog has, and a label beside its control is the first thing to break there.
 *
 * No box of its own. The control already carries an edge, and a card drawn around it is a box inside
 * a box — which reads as a group of things rather than as one question, and leaves a margin of dead
 * space wherever the control is smaller than the card.
 *
 * @param label - What is being asked for.
 * @param description - What answering it does, said in a line or two.
 * @param aside - Something small beside the label, such as a badge saying where a value came from.
 * @param isLabelHidden - Whether the label is only read out, for a field whose heading already says
 *   what it is; anything that sat beside it moves into the control's top corner instead.
 * @param error - What is wrong with the answer, in red beneath it, for a control that does not say
 *   so itself.
 * @param hint - Anything to say after the control, such as what happens to what was typed.
 * @param children - The control that answers it.
 * @param className - Extra classes for the caller's own layout.
 */
const FormField = ({
  label,
  description,
  aside,
  isLabelHidden = false,
  hint,
  error,
  children,
  className,
}: FormFieldProps) => (
  <div data-slot="form-field" className={cn('flex flex-col gap-2', className)}>
    {isLabelHidden ? (
      <>
        <h4 className="sr-only">{label}</h4>
        <div
          className={cn(
            'relative flex min-w-0 flex-col gap-2',
            aside === undefined ? '' : '[&_input]:pr-24 [&_textarea]:pr-24',
          )}
        >
          {children}
          {aside === undefined ? null : (
            <div className="absolute top-0 right-1.5 flex h-8 items-center gap-2">{aside}</div>
          )}
        </div>
      </>
    ) : (
      <>
        <div className="flex flex-col gap-0.5">
          {aside === undefined ? (
            <h4 className={cn(FIELD_TEXT.label, 'leading-tight')}>{label}</h4>
          ) : (
            <div className="flex min-h-6 items-center gap-2">
              <h4 className={cn(FIELD_TEXT.label, 'leading-tight')}>{label}</h4>
              {aside}
            </div>
          )}

          {description === undefined ? null : (
            <span className={FIELD_TEXT.note}>{description}</span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">{children}</div>
      </>
    )}

    {error === undefined ? null : (
      <span role="alert" className={FIELD_TEXT.error}>
        {error}
      </span>
    )}

    {hint === undefined ? null : (
      <div className={cn(FIELD_TEXT.note, 'flex flex-wrap items-center gap-x-2 gap-y-1')}>
        {hint}
      </div>
    )}
  </div>
);

FormField.displayName = 'FormField';

export { FormField };
