import { cn } from '@ValenceUI/cn';
import type { FormProps } from './Form.types';

/**
 * Something a person fills in and sends, as one thing: pressing Enter in any of its fields sends it,
 * the same as its button does, and the browser's own checking is left off so the form's schema is
 * the only judge of what is wrong. Holding a dialog's body and footer, it takes the dialog's room and
 * lays them out as the dialog would have.
 *
 * @param label - What the form is for, read out to anybody who cannot see it.
 * @param onSubmit - Told when it is sent.
 * @param children - The fields, and the way to send them.
 * @param isDialog - Whether it holds a dialog's body and footer rather than a block of fields.
 * @param className - Extra classes for the caller's own layout.
 */
const Form = ({ label, onSubmit, children, isDialog = false, className }: FormProps) => (
  <form
    aria-label={label}
    noValidate
    onSubmit={onSubmit}
    className={cn(isDialog ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col gap-5', className)}
  >
    {children}
  </form>
);

Form.displayName = 'Form';

export { Form };
